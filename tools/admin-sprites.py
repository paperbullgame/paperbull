# turns src/brand/sprites.png into the compressed sheet the admin inlines
from PIL import Image
import os
im = Image.open('src/brand/sprites.png')
im.save('src/brand/admin-items.webp', 'WEBP', quality=84, method=6)
os.remove('src/brand/sprites.png')
print('admin-items.webp', os.path.getsize('src/brand/admin-items.webp'))
