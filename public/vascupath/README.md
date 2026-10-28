# VascuPath research figures

These images were supplied by Arush Vyas in `Vyas.Arush.Final.pptx` on October 28, 2026. They were extracted from the presentation's `ppt/media/` archive without re-encoding, cropping, or repainting their content.

| Served file | Presentation media | Dimensions | Meaning |
| --- | --- | --- | --- |
| `original.jpg` | `image8.jpg` | 1400×868 | Original tissue image used beside the tile-prediction example |
| `predictions.jpg` | `image7.jpg` | 1400×870 | Tile predictions: white matter (blue), grey matter (pink), vessel (red) |
| `attention.png` | `image9.png` | 612×432 | Paired original/attention examples, including the original percentile-rank color scale |

Original and Predictions share the inspector's normalized viewing position. Attention is a distinct supplied figure and keeps separate view state. The full attention source is only 612×432 pixels; magnifying it does not add detail. Its source scale and paired examples remain intact.

The brain-slice position in the portfolio is an illustrative navigation device. These figures have not been spatially registered to that generic anatomy.

Resolution audit: slides 1 and 3 both reference the same `image7.jpg`/`image8.jpg` media. The presentation contains no higher-resolution prediction duplicate, vector SVG/EMF/WMF alternative, or embedded original document. The 1920-pixel media are statistical figures rather than versions of the tile predictions. The inspector uses the source images directly, keeps their natural proportions and browser photographic interpolation, and aligns image positions/widths to the device-pixel grid to avoid an extra fractional positioning blur. Magnification is a closer view of these finite source pixels; no super-resolution, synthetic sharpening, or re-encoding has been applied.

SHA-256:

```text
original.jpg     bd8300cc2ddafe476086353d913fba62a7f5f03bcbc7688b66d057611fae4391
predictions.jpg  cabbf569230243d5f1d8c1e853bafa1271e66d5a1e8c1c4c3a4a6fe488b8779f
attention.png    be11061cff87a9e05a7cf1f7bd39c629f364e04f362d335574f6bf490fbfb159
```
