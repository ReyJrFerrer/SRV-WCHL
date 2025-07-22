import re
import sys
import os

def add_prefix_to_classnames_in_file(file_path, prefix="mp_"):
    """
    Reads a file, adds a prefix to className strings,
    and writes the changes back to the file.
    """
    if not os.path.exists(file_path):
        print(f"Error: File not found at {file_path}")
        return

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError:
        print(f"Error: Could not read {file_path} as UTF-8")
        return
    except Exception as e:
        print(f"Error reading file: {e}")
        return

    # Regex to find className="any string" or className='any string'
    pattern = re.compile(r'className=(["\'])((?:(?!\1).)*?)\1')

    def replacement_function(match):
        quote_char = match.group(1)
        class_string = match.group(2)

        # Skip already converted or dynamic classNames (containing { or $)
        if not class_string or '{' in class_string or '$' in class_string:
            return match.group(0)

        # Split class names and filter out empty strings
        class_names = [name.strip() for name in class_string.split() if name.strip()]

        if not class_names:
            return f'className={quote_char}{quote_char}'

        # Add prefix to each class name if it doesn't already have it
        prefixed_classes = []
        for class_name in class_names:
            if class_name.startswith(prefix):
                # Already has prefix, keep as is
                prefixed_classes.append(class_name)
            else:
                # Add prefix
                prefixed_classes.append(f"{prefix}{class_name}")

        # Join the prefixed class names back together
        new_class_string = ' '.join(prefixed_classes)
        return f'className={quote_char}{new_class_string}{quote_char}'

    # Count matches for feedback
    matches = list(pattern.finditer(content))
    if not matches:
        print(f"No className attributes found in {file_path}")
        return

    modified_content = pattern.sub(replacement_function, content)

    # Only write if content actually changed
    if modified_content != content:
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(modified_content)
            print(f"Successfully processed {len(matches)} className attribute(s) in {file_path}")
        except Exception as e:
            print(f"Error writing file: {e}")
    else:
        print(f"No changes made to {file_path} (all classNames already have prefix or are dynamic)")

def process_multiple_files(file_paths, prefix="mp_"):
    """
    Process multiple files at once.
    """
    for file_path in file_paths:
        print(f"\nProcessing: {file_path}")
        add_prefix_to_classnames_in_file(file_path, prefix)

def preview_changes(file_path, prefix="mp_"):
    """
    Preview what changes would be made without modifying the file.
    """
    if not os.path.exists(file_path):
        print(f"Error: File not found at {file_path}")
        return

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading file: {e}")
        return

    pattern = re.compile(r'className=(["\'])((?:(?!\1).)*?)\1')
    matches = list(pattern.finditer(content))
    
    if not matches:
        print(f"No className attributes found in {file_path}")
        return

    print(f"\nPreview of changes for {file_path}:")
    print("-" * 50)
    
    for i, match in enumerate(matches, 1):
        quote_char = match.group(1)
        class_string = match.group(2)
        
        if not class_string or '{' in class_string or '$' in class_string:
            print(f"{i}. SKIPPED (dynamic): {match.group(0)}")
            continue
            
        class_names = [name.strip() for name in class_string.split() if name.strip()]
        if not class_names:
            continue
            
        prefixed_classes = []
        changed = False
        for class_name in class_names:
            if class_name.startswith(prefix):
                prefixed_classes.append(class_name)
            else:
                prefixed_classes.append(f"{prefix}{class_name}")
                changed = True
        
        if changed:
            old_attr = f'className={quote_char}{class_string}{quote_char}'
            new_attr = f'className={quote_char}{" ".join(prefixed_classes)}{quote_char}'
            print(f"{i}. BEFORE: {old_attr}")
            print(f"   AFTER:  {new_attr}")
        else:
            print(f"{i}. NO CHANGE: {match.group(0)}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python add_classname_prefix.py <path_to_jsx_file> [additional_files...] [--prefix=custom_] [--preview]")
        print("Example: python add_classname_prefix.py component.jsx")
        print("Example: python add_classname_prefix.py *.jsx *.tsx")
        print("Example: python add_classname_prefix.py component.jsx --prefix=my_")
        print("Example: python add_classname_prefix.py component.jsx --preview")
        sys.exit(1)
    
    # Parse arguments
    args = sys.argv[1:]
    prefix = "mp_"
    preview_mode = False
    file_patterns = []
    
    for arg in args:
        if arg.startswith("--prefix="):
            prefix = arg.split("=", 1)[1]
        elif arg == "--preview":
            preview_mode = True
        else:
            file_patterns.append(arg)
    
    if not file_patterns:
        print("No files specified.")
        sys.exit(1)
    
    # Expand glob patterns if any
    import glob
    expanded_files = []
    for file_pattern in file_patterns:
        if '*' in file_pattern or '?' in file_pattern:
            matched_files = glob.glob(file_pattern)
            if matched_files:
                expanded_files.extend(matched_files)
            else:
                print(f"Warning: No files matched pattern '{file_pattern}'")
        else:
            expanded_files.append(file_pattern)
    
    if expanded_files:
        print(f"Using prefix: '{prefix}'")
        if preview_mode:
            print("PREVIEW MODE - No files will be modified")
            for file_path in expanded_files:
                preview_changes(file_path, prefix)
        else:
            if len(expanded_files) == 1:
                add_prefix_to_classnames_in_file(expanded_files[0], prefix)
            else:
                process_multiple_files(expanded_files, prefix)
    else:
        print("No files to process.")