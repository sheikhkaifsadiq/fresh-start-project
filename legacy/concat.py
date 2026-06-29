import os
import glob

output_file = 'response.md'
md_files = glob.glob('**/*.md', recursive=True)

with open(output_file, 'w', encoding='utf-8') as outfile:
    for fname in md_files:
        if os.path.basename(fname) == 'response.md':
            continue
        outfile.write(f'# File: {fname}\n\n')
        with open(fname, 'r', encoding='utf-8') as infile:
            outfile.write(infile.read())
        outfile.write('\n\n---\n\n')
