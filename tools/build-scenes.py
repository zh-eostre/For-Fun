# Builds the battle backdrops in art/scenes from Dungeon Crawl tiles: a wall strip and a floor texture for each zone of the
# tower, and the torch. Needs Pillow and the tile pack from https://opengameart.org/content/dungeon-crawl-32x32-tiles
# ("Dungeon Crawl Stone Soup Full" zip):  python3 tools/build-scenes.py path/to/the.zip art/scenes
import zipfile,sys,io,random
from PIL import Image
z=zipfile.ZipFile(sys.argv[1]);out=sys.argv[2];pre='Dungeon Crawl Stone Soup Full/dungeon/'
names=[x for x in z.namelist() if x.startswith(pre) and x.endswith('.png')]
def tiles(prefix,excl=()):
    r=[Image.open(io.BytesIO(z.read(x))).convert('RGBA') for x in sorted(names) if x[len(pre):].startswith(prefix) and not any(e in x for e in excl)]
    assert r,prefix;return r
def strip(ts,w,h,seed):
    random.seed(seed);im=Image.new('RGBA',(w*32,h*32))
    for y in range(h):
        for x in range(w):im.alpha_composite(random.choice(ts),(x*32,y*32))
    return im.convert('RGB')
Z={'a':('wall/stone_brick_','floor/grey_dirt_',('_old',)),'b':('wall/brick_dark_','floor/rect_gray_',('_old',)),
   'c':('wall/brick_brown-vines_','floor/limestone_',()),'boss':('wall/hell_','floor/cobble_blood_',('_old',))}
for k,(w,f,ex) in Z.items():
    strip(tiles(w,ex),20,6,k).save(f'{out}/{k}-wall.png',optimize=True)
    strip(tiles(f,ex),12,12,k+'f').save(f'{out}/{k}-floor.png',optimize=True)
open(f'{out}/torch.png','wb').write(z.read(pre+'wall/torches/torch_0.png'))
print('ok')
