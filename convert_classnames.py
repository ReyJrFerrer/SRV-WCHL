import re
import sys
import os

def convert_class_names_in_file(file_path):
    """
    Reads a file, converts simple className strings to CSS module syntax,
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
    # Fixed: Added capturing group for the class string content
    pattern = re.compile(r'className=(["\'])((?:(?!\1).)*?)\1')

    def replacement_function(match):
        quote_char = match.group(1)
        class_string = match.group(2)

        # Skip already converted or dynamic classNames
        if not class_string or '{' in class_string:
            return match.group(0)

        # Split class names and filter out empty strings
        class_names = [name.strip() for name in class_string.split() if name.strip()]

        if not class_names:
            return f'className={quote_char}{quote_char}'

        if len(class_names) == 1:
            class_name = class_names[0]
            # Use bracket notation for class names with hyphens or special characters
            if '-' in class_name or not class_name.isidentifier():
                return f"className={{styles['{class_name}']}}"
            else:
                return f"className={{styles.{class_name}}}"
        else:
            # Build a template literal for multiple class names
            styled_classes = []
            for name in class_names:
                if '-' in name or not name.isidentifier():
                    styled_classes.append(f"${{styles['{name}']}}")
                else:
                    styled_classes.append(f"${{styles.{name}}}")
            
            joined_classes = ' '.join(styled_classes)
            return f'className={{`{joined_classes}`}}'

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
        print(f"No changes made to {file_path} (all classNames already converted or dynamic)")

def process_multiple_files(file_paths):
    """
    Process multiple files at once.
    """
    for file_path in file_paths:
        print(f"\nProcessing: {file_path}")
        convert_class_names_in_file(file_path)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python convert_classnames.py <path_to_jsx_file> [additional_files...]")
        print("Example: python convert_classnames.py component.jsx")
        print("Example: python convert_classnames.py *.jsx *.tsx")
        sys.exit(1)
    
    files_to_process = sys.argv[1:]
    
    # Expand glob patterns if any
    import glob
    expanded_files = []
    for file_pattern in files_to_process:
        if '*' in file_pattern or '?' in file_pattern:
            matched_files = glob.glob(file_pattern)
            if matched_files:
                expanded_files.extend(matched_files)
            else:
                print(f"Warning: No files matched pattern '{file_pattern}'")
        else:
            expanded_files.append(file_pattern)
    
    if expanded_files:
        if len(expanded_files) == 1:
            convert_class_names_in_file(expanded_files[0])
        else:
            process_multiple_files(expanded_files)
    else:
        print("No files to process.")