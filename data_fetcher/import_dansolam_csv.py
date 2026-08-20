import csv
import os
import urllib.request
import re
import json

csv_path = '/Users/chrisngbede/Desktop/laravel/dansolam/wc-product-export-20-7-2026-1784528035786.csv'
storage_dir = '/Users/chrisngbede/Desktop/laravel/dansolam/public/storage/products'
os.makedirs(storage_dir, exist_ok=True)

products = []
all_categories = set()

headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

def clean_text(text):
    if not text:
        return ''
    text = text.replace('&amp;', '&').replace('&nbsp;', ' ')
    return text.strip()

def slugify(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')

def download_image(url):
    if not url:
        return None
    url = url.strip()
    if not url.startswith('http'):
        return None
    filename = os.path.basename(url.split('?')[0])
    if not filename:
        filename = f"img_{hash(url)}.jpg"
    
    local_filepath = os.path.join(storage_dir, filename)
    relative_url = f"/storage/products/{filename}"
    
    if not os.path.exists(local_filepath):
        try:
            print(f"Downloading {url} -> {filename}...")
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=15) as response, open(local_filepath, 'wb') as out_file:
                out_file.write(response.read())
            print(f"Saved {filename}")
        except Exception as e:
            print(f"Failed to download {url}: {e}")
            return url
    return relative_url

with open(csv_path, mode='r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        name = clean_text(row.get('Name', ''))
        if not name:
            continue
        
        sku = row.get('SKU', '').strip()
        reg_price = row.get('Regular price', '').strip()
        sale_price = row.get('Sale price', '').strip()
        
        try:
            reg_val = float(reg_price) if reg_price else 0.0
        except ValueError:
            reg_val = 0.0
            
        try:
            sale_val = float(sale_price) if sale_price else None
        except ValueError:
            sale_val = None

        short_desc = clean_text(row.get('Short description', ''))
        desc = clean_text(row.get('Description', ''))
        cats_raw = row.get('Categories', '')
        
        cat_list = [clean_text(c) for c in cats_raw.split(',') if clean_text(c)]
        for c in cat_list:
            all_categories.add(c)
            
        imgs_raw = row.get('Images', '')
        img_urls = [i.strip() for i in imgs_raw.split(',') if i.strip()]
        local_imgs = []
        for img_url in img_urls:
            loc = download_image(img_url)
            if loc:
                local_imgs.append(loc)
                
        products.append({
            'wc_id': row.get('ID'),
            'name': name,
            'slug': slugify(name),
            'sku': sku if sku else f"DSL-{row.get('ID')}",
            'regular_price': reg_val,
            'sale_price': sale_val,
            'short_description': short_desc,
            'description': desc,
            'categories': cat_list,
            'images': local_imgs,
            'is_featured': row.get('Is featured?') == '1',
            'in_stock': row.get('In stock?') == '1'
        })

print(f"\nParsed {len(products)} products and {len(all_categories)} categories.")
print("Categories found:", sorted(list(all_categories)))

with open('/Users/chrisngbede/Desktop/laravel/dansolam/data_fetcher/parsed_products.json', 'w', encoding='utf-8') as out_j:
    json.dump({'categories': sorted(list(all_categories)), 'products': products}, out_j, indent=2)
