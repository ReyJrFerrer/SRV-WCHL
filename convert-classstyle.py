import re
import sys
import os

def add_prefix_to_css_classes(css_content, prefix="mp_"):
    """
    Add a prefix to all CSS class selectors in the given CSS content.
    
    Args:
        css_content (str): The CSS content as a string
        prefix (str): The prefix to add to class names (default: "mp_")
    
    Returns:
        str: CSS content with prefixed class names
    """
    
    # Pattern to match CSS class selectors
    # This handles:
    # - Simple classes: .classname
    # - Classes with pseudo-elements: .classname::before, .classname::after
    # - Classes with pseudo-classes: .classname:hover, .classname:active
    # - Multiple classes: .class1.class2
    # - Complex selectors: .parent .child, .class > .another
    
    def replace_class(match):
        full_match = match.group(0)
        class_name = match.group(1)
        
        # Don't add prefix if it already exists
        if class_name.startswith(prefix):
            return full_match
        
        # Replace the class name with prefixed version
        return full_match.replace('.' + class_name, '.' + prefix + class_name, 1)
    
    # Pattern explanation:
    # \.([a-zA-Z][a-zA-Z0-9_-]*) matches:
    # - \. : literal dot
    # - ([a-zA-Z][a-zA-Z0-9_-]*) : class name starting with letter, followed by letters/numbers/underscore/hyphen
    # (?=[\s\.\#\:\,\{\>\+\~\[\)]) : positive lookahead for valid characters after class name
    
    pattern = r'\.([a-zA-Z][a-zA-Z0-9_-]*)(?=[\s\.\#\:\,\{\>\+\~\[\)])'
    
    result = re.sub(pattern, replace_class, css_content)
    return result

def process_css_file(input_file, output_file=None, prefix="mp_"):
    """
    Process a CSS file and add prefix to all class names.
    
    Args:
        input_file (str): Path to input CSS file
        output_file (str): Path to output CSS file (optional)
        prefix (str): Prefix to add to class names
    """
    
    try:
        # Read the input file
        with open(input_file, 'r', encoding='utf-8') as f:
            css_content = f.read()
        
        # Process the CSS content
        processed_css = add_prefix_to_css_classes(css_content, prefix)
        
        # Determine output file name
        if output_file is None:
            name, ext = os.path.splitext(input_file)
            output_file = f"{name}_prefixed{ext}"
        
        # Write the processed content
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(processed_css)
        
        print(f"✅ Successfully processed CSS file!")
        print(f"📁 Input:  {input_file}")
        print(f"📁 Output: {output_file}")
        print(f"🏷️  Prefix: {prefix}")
        
    except FileNotFoundError:
        print(f"❌ Error: File '{input_file}' not found.")
    except Exception as e:
        print(f"❌ Error processing file: {str(e)}")

def process_css_string(css_string, prefix="mp_"):
    """
    Process a CSS string and return the result with prefixed class names.
    
    Args:
        css_string (str): CSS content as string
        prefix (str): Prefix to add to class names
    
    Returns:
        str: Processed CSS content
    """
    return add_prefix_to_css_classes(css_string, prefix)

# Example usage and testing
if __name__ == "__main__":
    # Test with your example
    test_css = """
  .arrow-circle {
    width: 5rem;
    height: 5rem;
  }

  .toggle-switch {
    width: 8rem;
    height: 5rem;
  }

  .toggle-switch::after {
    width: 4.5rem;
    height: 4.5rem;
  }

  .dots-line {
    transform: translate(120px, -70px);
  }
    """
    
    # Command line usage
    if len(sys.argv) > 1:
        input_file = sys.argv[1]
        output_file = sys.argv[2] if len(sys.argv) > 2 else None
        prefix = sys.argv[3] if len(sys.argv) > 3 else "mp_"
        
        process_css_file(input_file, output_file, prefix)
    else:
        # Demo with test CSS
        print("🧪 Demo with test CSS:")
        print("\n--- Original CSS ---")
        print(test_css)
        
        processed = process_css_string(test_css)
        print("\n--- Processed CSS ---")
        print(processed)
        
        print("\n" + "="*50)
        print("📋 Usage Instructions:")
        print("1. Save this script as 'css_prefix_tool.py'")
        print("2. Run from command line:")
        print("   python css_prefix_tool.py input.css [output.css] [prefix]")
        print("\n💡 Examples:")
        print("   python css_prefix_tool.py styles.css")
        print("   python css_prefix_tool.py styles.css prefixed_styles.css")
        print("   python css_prefix_tool.py styles.css prefixed_styles.css custom_")
        print("\n🔧 Or use the functions in your own code:")
        print("   result = process_css_string(css_content, 'mp_')")