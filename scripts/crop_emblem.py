from PIL import Image

for filename in ['public/images/emblem.png', 'public/images/logo.png']:
    img = Image.open(filename).convert('RGBA')
    bbox = img.getbbox()
    print(f"Original {filename}: size={img.size}, bbox={bbox}")
    
    # Crop tightly to the content
    # Add small padding of 4px so edges aren't clipped
    pad = 4
    left = max(0, bbox[0] - pad)
    top = max(0, bbox[1] - pad)
    right = min(img.width, bbox[2] + pad)
    bottom = min(img.height, bbox[3] + pad)
    
    cropped = img.crop((left, top, right, bottom))
    print(f"Cropped {filename}: size={cropped.size}")
    
    # Scale up using high-quality LANCZOS resampling to crisp 800px height for ultra-crisp display
    target_height = 800
    target_width = int(cropped.width * (target_height / cropped.height))
    upscaled = cropped.resize((target_width, target_height), Image.Resampling.LANCZOS)
    print(f"Upscaled {filename} to {upscaled.size}")
    
    upscaled.save(filename, 'PNG', optimize=True)
    print(f"Saved {filename} successfully!\n")
