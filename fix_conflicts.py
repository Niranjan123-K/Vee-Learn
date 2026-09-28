import os
import glob

client_dir = r"d:\Vee Learn\client"

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    new_lines = []
    state = "NORMAL"
    changed = False
    
    for line in lines:
        if line.startswith("<<<<<<< Updated upstream"):
            state = "UPSTREAM"
            changed = True
        elif line.startswith("======="):
            if state == "UPSTREAM":
                state = "STASHED"
            else:
                new_lines.append(line)
        elif line.startswith(">>>>>>> Stashed changes"):
            if state == "STASHED":
                state = "NORMAL"
            else:
                new_lines.append(line)
        else:
            if state == "NORMAL" or state == "UPSTREAM":
                new_lines.append(line)
                
    if changed:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
        print(f"Fixed {filepath}")

for root, _, files in os.walk(client_dir):
    if "node_modules" in root:
        continue
    for file in files:
        if file.endswith(('.js', '.jsx', '.css')):
            filepath = os.path.join(root, file)
            try:
                fix_file(filepath)
            except Exception as e:
                pass
print("Done")
