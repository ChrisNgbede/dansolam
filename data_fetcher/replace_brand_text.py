import os
import re

root_dir = '/Users/chrisngbede/Desktop/laravel/dansolam'

replacements = [
    ('fairqueen_cart', 'dansolam_cart'),
    ('fairqueen_wishlist', 'dansolam_wishlist'),
    ('fairqueen_admin_token', 'dansolam_admin_token'),
    ('fairqueen_customer_token', 'dansolam_customer_token'),
    ('fairqueen_token', 'dansolam_token'),
    ('fairqueen_remembered_admin_email', 'dansolam_remembered_admin_email'),
    ('fairqueen_remembered_email', 'dansolam_remembered_email'),
    ('fairqueen_maintenance_bypass', 'dansolam_maintenance_bypass'),
    ('fairqueen_pos_offline', 'dansolam_pos_offline'),
    ('fairqueen_currency_symbol', 'dansolam_currency_symbol'),
    ('fairqueen_sidebar_collapsed', 'dansolam_sidebar_collapsed'),
    ('fairqueen_admin_dark_mode', 'dansolam_admin_dark_mode'),
    ('fairqueen_storefront_theme', 'dansolam_storefront_theme'),
    ('fairqueen_popup_dismissed', 'dansolam_popup_dismissed'),
    ('fairqueen-cache-v2', 'dansolam-cache-v2'),
    ('fairqueen.com', 'dansolam.com'),
    ('fairqueen_collections', 'dansolam_official'),
    ('FairQueen Collections', 'Dansolam Beauty Home'),
    ('FairQueen', 'Dansolam'),
    ('fairqueen', 'dansolam'),
    ('FAIRQUEEN', 'DANSOLAM'),
]

target_extensions = ('.js', '.jsx', '.json', '.md', '.html', '.php', '.css')

modified_count = 0

for dirpath, _, filenames in os.walk(root_dir):
    if 'node_modules' in dirpath or 'vendor' in dirpath or '.git' in dirpath or '.gemini' in dirpath:
        continue
    for f in filenames:
        if f.endswith(target_extensions):
            filepath = os.path.join(dirpath, f)
            try:
                with open(filepath, 'r', encoding='utf-8') as file_obj:
                    content = file_obj.read()
                
                new_content = content
                for old_str, new_str in replacements:
                    new_content = new_content.replace(old_str, new_str)
                
                if new_content != content:
                    with open(filepath, 'w', encoding='utf-8') as file_obj:
                        file_obj.write(new_content)
                    print(f"Updated: {filepath}")
                    modified_count += 1
            except Exception as e:
                pass

print(f"\nTotal files updated: {modified_count}")
