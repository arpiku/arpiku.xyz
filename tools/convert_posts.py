#!/usr/bin/env python3
"""
Jekyll Post to Static HTML Converter
Converts Jekyll markdown posts to static HTML files.
"""

import os
import re
import sys
from datetime import datetime

try:
    import markdown
except ImportError:
    print("Installing markdown library...")
    os.system("pip install markdown")
    import markdown

def parse_frontmatter(content):
    """Parse Jekyll frontmatter from markdown content."""
    if not content.startswith('---'):
        return {}, content
    
    parts = content.split('---', 2)
    if len(parts) < 3:
        return {}, content
    
    frontmatter_text = parts[1]
    body = parts[2]
    
    frontmatter = {}
    for line in frontmatter_text.strip().split('\n'):
        if ':' in line:
            key, value = line.split(':', 1)
            key = key.strip().strip('"')
            value = value.strip().strip('"').strip("'")
            
            if value.startswith('['):
                value = value.strip('[]').split(',')
                value = [v.strip().strip('"').strip("'") for v in value]
            
            frontmatter[key] = value
    
    return frontmatter, body.strip()

def clean_jekyll_syntax(content):
    """Remove Jekyll-specific syntax like {% raw %}, {% endraw %}, {% %}."""
    content = re.sub(r'\{% raw %\}', '', content)
    content = re.sub(r'\{% endraw %\}', '', content)
    content = re.sub(r'\{%.*?%\}', '', content, flags=re.DOTALL)
    return content

def slugify(text):
    """Convert text to URL-friendly slug."""
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    text = text.strip('-')
    return text

def convert_to_html(markdown_content):
    """Convert markdown to HTML with extensions."""
    md = markdown.Markdown(extensions=[
        'fenced_code',
        'codehilite',
        'tables',
        'nl2br',
        'sane_lists'
    ])
    
    html = md.convert(markdown_content)
    return html

def generate_post_html(frontmatter, content_html, template_path):
    """Generate the final HTML post from template."""
    with open(template_path, 'r') as f:
        template = f.read()
    
    title = frontmatter.get('title', 'Untitled')
    date = frontmatter.get('date', '')
    if isinstance(date, str) and '+' in date:
        date = date.split('+')[0].strip()
    
    tags = frontmatter.get('tags', [])
    if isinstance(tags, str):
        tags = [tags]
    elif not isinstance(tags, list):
        tags = []
    
    tags_html = ' '.join([f'<span class="post-tag">{tag}</span>' for tag in tags])
    
    output = template.replace('{{TITLE}}', title)
    output = output.replace('{{DATE}}', str(date))
    output = output.replace('{{TAGS}}', tags_html)
    output = output.replace('{{CONTENT}}', content_html)
    
    return output

def convert_posts(posts_dir, output_dir, template_path):
    """Convert all Jekyll posts to static HTML."""
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    post_files = [f for f in os.listdir(posts_dir) if f.endswith('.md')]
    post_files.sort(reverse=True)
    
    converted_posts = []
    
    for filename in post_files:
        filepath = os.path.join(posts_dir, filename)
        print(f"Converting: {filename}")
        
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        frontmatter, body = parse_frontmatter(content)
        body = clean_jekyll_syntax(body)
        content_html = convert_to_html(body)
        
        title = frontmatter.get('title', slugify(filename))
        slug = slugify(title)
        output_filename = f"{slug}.html"
        output_path = os.path.join(output_dir, output_filename)
        
        post_html = generate_post_html(frontmatter, content_html, template_path)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(post_html)
        
        print(f"  -> Created: {output_filename}")
        
        date_str = frontmatter.get('date', '')
        if isinstance(date_str, str) and '+' in date_str:
            date_str = date_str.split('+')[0].strip()
        
        excerpt = body[:200].replace('\n', ' ').strip()
        if len(body) > 200:
            excerpt += '...'
        
        converted_posts.append({
            'title': title,
            'date': str(date_str),
            'url': f"posts/{output_filename}",
            'tags': frontmatter.get('tags', []),
            'excerpt': excerpt
        })
    
    return converted_posts

def update_blog_index(converted_posts, blog_index_path):
    """Update the blog index page with converted posts."""
    with open(blog_index_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    posts_json = "const posts = " + str(converted_posts).replace("'", '"') + ";"
    
    if "const posts = [" in content:
        start = content.index("const posts = [")
        end = content.index("// END POSTS DATA", start)
        content = content[:start] + posts_json + "\n\n    // END POSTS DATA" + content[end + len("// END POSTS DATA"):]
    
    with open(blog_index_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"\nUpdated blog index with {len(converted_posts)} posts")

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    
    posts_dir = os.path.join(project_root, '..', 'arpiku.github.io', '_posts')
    output_dir = os.path.join(project_root, 'blog', 'posts')
    template_path = os.path.join(project_root, 'blog', 'post-template.html')
    blog_index_path = os.path.join(project_root, 'blog', 'index.html')
    
    if not os.path.exists(posts_dir):
        print(f"Error: Posts directory not found: {posts_dir}")
        sys.exit(1)
    
    if not os.path.exists(template_path):
        print(f"Error: Template not found: {template_path}")
        sys.exit(1)
    
    print("=" * 50)
    print("Jekyll to Static HTML Converter")
    print("=" * 50)
    print(f"Source: {posts_dir}")
    print(f"Output: {output_dir}")
    print("=" * 50)
    
    converted_posts = convert_posts(posts_dir, output_dir, template_path)
    update_blog_index(converted_posts, blog_index_path)
    
    print("\nConversion complete!")

if __name__ == '__main__':
    main()
