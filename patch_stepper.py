import re

with open('app/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find boundaries
start_marker = '// \u2500\u2500\u2500 Horizontal Stepper'
end_marker = '// \u2500\u2500\u2500 Step 1: Personal Data'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

print(f'start_idx={start_idx}, end_idx={end_idx}')

if start_idx == -1 or end_idx == -1:
    print('MARKERS NOT FOUND')
else:
    new_block = (
        '// \u2500\u2500\u2500 Horizontal Stepper \u2014 centered columns with arrow connectors \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n'
        'function Steps({current}:{current:number}){\n'
        "  const labels = ['Data Diri','Detail Pengaduan','Unggah Bukti'];\n"
        '  return (\n'
        '    <div className="stepper">\n'
        '      {[1,2,3].map((n,i)=>(\n'
        '        <div key={n} className="stepper-row">\n'
        "          <div className={'stepper-col'+(n<current?' done':n===current?' active':'')}>\n"
        '            <div className="stepper-circle">\n'
        '              {n<current?<Check size={16}/>:n}\n'
        '            </div>\n'
        '            <span className="stepper-label">{labels[i]}</span>\n'
        '          </div>\n'
        '          {i<2&&(\n'
        "            <div className={'stepper-arrow'+(n<current?' done':'')}>&#8250;</div>\n"
        '          )}\n'
        '        </div>\n'
        '      ))}\n'
        '    </div>\n'
        '  );\n'
        '}\n\n'
    )
    content = content[:start_idx] + new_block + content[end_idx:]
    with open('app/page.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('DONE - Steps component replaced')
