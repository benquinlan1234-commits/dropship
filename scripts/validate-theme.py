#!/usr/bin/env python3
"""
Shopify runtime rules that `shopify theme check` does NOT enforce.

Every rule here corresponds to something Shopify validates when it loads the
theme, but which passes static checking — so the theme uploads and then fails
to render. Run this alongside `shopify theme check`.

    python3 scripts/validate-theme.py

Exits non-zero if anything fails.
"""
import json
import os
import re
import sys

SCHEMA_RE = re.compile(r'\{%-?\s*schema\s*-?%\}(.*?)\{%-?\s*endschema\s*-?%\}', re.S)
ID_RE = re.compile(r'^[A-Za-z0-9_-]+$')
HEX_RE = re.compile(r'^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$')
SIDEBAR_TYPES = {'header', 'paragraph'}
MAX_UNIT_CHARS = 3
MAX_RANGE_STEPS = 101
MAX_SECTION_NAME = 25

fails, warns = [], []
F = fails.append
W = warns.append


def no_duplicate_keys(pairs):
    seen = {}
    for key, value in pairs:
        if key in seen:
            raise ValueError('duplicate key %r' % key)
        seen[key] = value
    return seen


def load_json(path, text=None):
    """Parse strictly: Shopify rejects duplicate keys, Python would keep the last."""
    raw = text if text is not None else open(path, encoding='utf-8').read()
    return json.loads(raw, object_pairs_hook=no_duplicate_keys)


def on_step(value, minimum, step):
    exact = (value - minimum) / step
    return abs(round(exact) - exact) < 1e-9


def check_range(setting, label):
    sid = setting.get('id')
    lo, hi, step = setting.get('min'), setting.get('max'), setting.get('step')
    if None in (lo, hi, step):
        F('%s: range %s is missing min/max/step' % (label, sid))
        return
    if (hi - lo) / step > MAX_RANGE_STEPS:
        F('%s: range %s has %.0f steps (Shopify allows %d)'
          % (label, sid, (hi - lo) / step, MAX_RANGE_STEPS))
    unit = setting.get('unit')
    if unit and len(str(unit)) > MAX_UNIT_CHARS:
        F('%s: range %s unit %r is %d chars (Shopify allows %d)'
          % (label, sid, unit, len(str(unit)), MAX_UNIT_CHARS))
    if 'default' not in setting:
        F('%s: range %s has no default (Shopify requires one)' % (label, sid))
        return
    default = setting['default']
    if not isinstance(default, (int, float)) or isinstance(default, bool):
        F('%s: range %s default %r is not numeric' % (label, sid, default))
    elif not lo <= default <= hi:
        F('%s: range %s default %s is outside [%s, %s]' % (label, sid, default, lo, hi))
    elif not on_step(default, lo, step):
        F('%s: range %s default %s is not min + N*step (min=%s step=%s)'
          % (label, sid, default, lo, step))


def check_setting(setting, label):
    stype = setting.get('type')
    if not stype:
        F('%s: setting with no type' % label)
        return
    if stype in SIDEBAR_TYPES:
        if 'content' not in setting:
            F('%s: %s has no "content"' % (label, stype))
        return
    sid = setting.get('id')
    if not sid:
        F('%s: %s setting has no id' % (label, stype))
    elif not ID_RE.match(sid):
        F('%s: setting id %r has characters outside [A-Za-z0-9_-]' % (label, sid))
    if 'label' not in setting:
        F('%s: setting %s has no label' % (label, sid))

    default = setting.get('default')
    if stype == 'range':
        check_range(setting, label)
    elif stype in ('select', 'radio'):
        options = setting.get('options') or []
        if not options:
            F('%s: %s has no options' % (label, sid))
        for opt in options:
            if 'value' not in opt or 'label' not in opt:
                F('%s: %s option missing value/label: %r' % (label, sid, opt))
        values = [o.get('value') for o in options]
        if default is not None and default not in values:
            F('%s: %s default %r is not one of %r' % (label, sid, default, values))
    elif default is not None:
        if stype == 'checkbox' and not isinstance(default, bool):
            F('%s: %s checkbox default %r is not a boolean' % (label, sid, default))
        if stype == 'number' and (not isinstance(default, (int, float)) or isinstance(default, bool)):
            F('%s: %s number default %r is not numeric' % (label, sid, default))
        if stype == 'color' and isinstance(default, str) and not HEX_RE.match(default):
            F('%s: %s color default %r is not a hex colour' % (label, sid, default))
        if stype == 'richtext' and isinstance(default, str) and not default.strip().startswith('<'):
            F('%s: %s richtext default must be wrapped in a tag' % (label, sid))


def main():
    # ---- every .json file and every {% schema %} parses, with no duplicate keys
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d not in ('.git', 'node_modules', 'design', 'dist')]
        for name in sorted(files):
            if name.endswith('.json'):
                path = os.path.join(root, name)
                try:
                    load_json(path)
                except Exception as exc:
                    F('%s: %s' % (path, exc))

    sections, ranges = {}, {}
    for name in sorted(os.listdir('sections')):
        if not name.endswith('.liquid'):
            continue
        stype = name[:-7]
        src = open('sections/' + name, encoding='utf-8').read()
        blocks = SCHEMA_RE.findall(src)
        if len(blocks) > 1:
            F('sections/%s: %d schema blocks (max 1)' % (name, len(blocks)))
        schema = None
        if blocks:
            try:
                schema = load_json(None, blocks[0])
            except Exception as exc:
                F('sections/%s [schema]: %s' % (name, exc))
        sections[stype] = {'src': src, 'schema': schema}

        label = 'sections/' + name
        if schema is None:
            W('%s: no {%% schema %%}' % label)
            continue
        if not schema.get('name'):
            F('%s: schema has no "name"' % label)
        elif len(schema['name']) > MAX_SECTION_NAME:
            F('%s: name %r is %d chars (max %d)'
              % (label, schema['name'], len(schema['name']), MAX_SECTION_NAME))
        if 'enabled_on' in schema and 'disabled_on' in schema:
            F('%s: has both enabled_on and disabled_on' % label)
        for setting in schema.get('settings') or []:
            check_setting(setting, label)
            if setting.get('type') == 'range':
                ranges[(stype, setting['id'])] = setting
        for block in schema.get('blocks') or []:
            btype = block.get('type')
            if btype != '@app' and not block.get('name'):
                F('%s: block %r has no name' % (label, btype))
            for setting in block.get('settings') or []:
                check_setting(setting, "%s block '%s'" % (label, btype))
                if setting.get('type') == 'range':
                    ranges[(stype, btype, setting['id'])] = setting

    # ---- values stored in JSON templates and section groups must satisfy the schema
    for folder in ('templates', 'sections'):
        for name in sorted(os.listdir(folder)):
            if not name.endswith('.json'):
                continue
            path = os.path.join(folder, name)
            try:
                doc = load_json(path)
            except Exception:
                continue
            for sid, sec in (doc.get('sections') or {}).items():
                if not ID_RE.match(sid):
                    F('%s: section id %r has characters outside [A-Za-z0-9_-]' % (path, sid))
                stype = sec.get('type')
                if stype not in sections:
                    F('%s: section %r references missing section type %r' % (path, sid, stype))
                    continue
                schema = sections[stype]['schema'] or {}
                if 'enabled_on' in schema and folder == 'templates':
                    F('%s: section %r declares enabled_on and cannot be used in a page template'
                      % (path, stype))
                known = {s['id'] for s in (schema.get('settings') or []) if 'id' in s}
                for key, value in (sec.get('settings') or {}).items():
                    if key not in known:
                        F('%s: %s sets unknown setting %r' % (path, sid, key))
                    rng = ranges.get((stype, key))
                    if rng and isinstance(value, (int, float)) and not isinstance(value, bool):
                        if not rng['min'] <= value <= rng['max']:
                            F('%s: %s.%s = %s is outside [%s, %s]'
                              % (path, sid, key, value, rng['min'], rng['max']))
                        elif not on_step(value, rng['min'], rng['step']):
                            F('%s: %s.%s = %s is not min + N*step (min=%s step=%s)'
                              % (path, sid, key, value, rng['min'], rng['step']))
                declared = {b.get('type') for b in (schema.get('blocks') or [])}
                for bid, blk in (sec.get('blocks') or {}).items():
                    if not ID_RE.match(bid):
                        F('%s: block id %r has characters outside [A-Za-z0-9_-]' % (path, bid))
                    btype = blk.get('type')
                    if declared and btype not in declared and btype != '@app':
                        F('%s: %s block %r type %r not declared in the schema'
                          % (path, sid, bid, btype))
                    bdef = next((b for b in (schema.get('blocks') or []) if b.get('type') == btype), None)
                    bknown = {s['id'] for s in ((bdef or {}).get('settings') or []) if 'id' in s}
                    for key, value in (blk.get('settings') or {}).items():
                        if bdef and key not in bknown:
                            F('%s: %s block %r sets unknown setting %r' % (path, sid, bid, key))
                        rng = ranges.get((stype, btype, key))
                        if rng and isinstance(value, (int, float)) and not isinstance(value, bool):
                            if not (rng['min'] <= value <= rng['max']
                                    and on_step(value, rng['min'], rng['step'])):
                                F('%s: %s.%s.%s = %s invalid for range(min=%s,max=%s,step=%s)'
                                  % (path, sid, bid, key, value, rng['min'], rng['max'], rng['step']))
                for bid in (sec.get('block_order') or []):
                    if bid not in (sec.get('blocks') or {}):
                        F('%s: %s block_order references unknown block %r' % (path, sid, bid))
            for sid in doc.get('order', []):
                if sid not in (doc.get('sections') or {}):
                    F('%s: order references unknown section id %r' % (path, sid))
            if doc.get('sections') and 'order' not in doc:
                F('%s: has sections but no "order"' % path)

    # ---- theme settings
    try:
        schema_groups = load_json('config/settings_schema.json')
    except Exception as exc:
        F('config/settings_schema.json: %s' % exc)
        schema_groups = []
    theme_ranges, ids = {}, []
    for group in schema_groups:
        for setting in group.get('settings') or []:
            check_setting(setting, 'config/settings_schema.json')
            if 'id' in setting:
                ids.append(setting['id'])
            if setting.get('type') == 'range':
                theme_ranges[setting['id']] = setting
    duplicates = {i for i in ids if ids.count(i) > 1}
    if duplicates:
        F('config/settings_schema.json: setting ids repeated across groups: %s' % sorted(duplicates))

    try:
        data = load_json('config/settings_data.json')
    except Exception as exc:
        F('config/settings_data.json: %s' % exc)
        data = {}
    current = data.get('current')
    if isinstance(current, dict):
        for key, value in current.items():
            if key == 'sections':
                continue
            if key not in ids:
                F('config/settings_data.json: "current".%s is not declared in settings_schema.json' % key)
            rng = theme_ranges.get(key)
            if rng and isinstance(value, (int, float)) and not isinstance(value, bool):
                if not (rng['min'] <= value <= rng['max'] and on_step(value, rng['min'], rng['step'])):
                    F('config/settings_data.json: "current".%s = %s invalid for range(min=%s,max=%s,step=%s)'
                      % (key, value, rng['min'], rng['max'], rng['step']))

    # ---- structural Liquid rules
    snippets = {n[:-7] for n in os.listdir('snippets') if n.endswith('.liquid')}
    groups = {n[:-5] for n in os.listdir('sections') if n.endswith('.json')}
    for stype, entry in sections.items():
        for tag, target in re.findall(r"\{%-?\s*(section|sections)\s+'([^']+)'", entry['src']):
            F('sections/%s.liquid: contains {%% %s %r %%} — not allowed inside a section'
              % (stype, tag, target))
        for snippet in re.findall(r"\{%-?\s*render\s+'([^']+)'", entry['src']):
            if snippet not in snippets:
                F('sections/%s.liquid: renders missing snippet %r' % (stype, snippet))

    layout = open('layout/theme.liquid', encoding='utf-8').read()
    for name in re.findall(r"\{%-?\s*section\s+'([^']+)'", layout):
        if name not in sections:
            F('layout/theme.liquid: renders missing section %r' % name)
        elif 'enabled_on' in (sections[name]['schema'] or {}):
            F('layout/theme.liquid: {%% section %r %%} but that section declares enabled_on' % name)
    for name in re.findall(r"\{%-?\s*sections\s+'([^']+)'", layout):
        if name not in groups:
            F('layout/theme.liquid: renders missing section group %r' % name)
    for snippet in re.findall(r"\{%-?\s*render\s+'([^']+)'", layout):
        if snippet not in snippets:
            F('layout/theme.liquid: renders missing snippet %r' % snippet)

    for warn in warns:
        print('WARN  %s' % warn)
    for fail in fails:
        print('FAIL  %s' % fail)
    print('\n%d failures, %d warnings' % (len(fails), len(warns)))
    return 1 if fails else 0


if __name__ == '__main__':
    os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
    sys.exit(main())
