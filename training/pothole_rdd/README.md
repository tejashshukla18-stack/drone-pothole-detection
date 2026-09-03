# Pothole RDD2022 training workflow

This folder builds and trains a one-class `pothole` detector. It is deliberately
separate from the bridge model: roads and bridge components have different
camera viewpoints, defect shapes and decision thresholds.

## Included local data

`E:\DRONE project\dataset\Pothole.v1-raw.createml` is already present. It has
665 labelled images and 1,740 pothole boxes in CreateML format. The preparation
tool converts it to YOLO format while preserving its supplied train/validation/
test split.

`dataset\pothole_video` has paired RGB/mask videos. Do not split consecutive
frames from those videos randomly: reserve complete videos for final live-video
testing after the first model is trained.

## Add RDD2022

Download RDD2022 from its official project/Figshare source, review its licence
and extract it here:

```text
E:\DRONE project\dataset\rdd2022-raw\
  India\train\images\
  India\train\annotations\xmls\
  ...
```

RDD2022 uses Pascal VOC XML annotations. The conversion keeps D40/pothole
annotations only, retains a controlled number of D40-free images as hard
negatives, and converts boxes to YOLO labels. Never put RDD2022's unlabelled
`test` images in training or threshold selection.

## Build the dataset

Run this from `E:\DRONE project`. The first command is a small local baseline;
the second command adds RDD2022 when it has been downloaded.

```powershell
C:\venvs\pothole\Scripts\python.exe training\pothole_rdd\prepare_pothole_dataset.py --output training\pothole_rdd\data\pothole-local-v1
```

```powershell
C:\venvs\pothole\Scripts\python.exe training\pothole_rdd\prepare_pothole_dataset.py --rdd-root dataset\rdd2022-raw --output training\pothole_rdd\data\pothole-rdd-v1
```

The command creates a self-contained YOLO dataset plus `manifest.json`, which
records every input, split, source and retained pothole count. The generated
`pothole.yaml` is the only data file given to training.

## Train on a cloud GPU

Your local machine has 8 GB RAM and no CUDA GPU. Upload the prepared
`training\pothole_rdd\data\pothole-rdd-v1` folder and this `training\pothole_rdd`
folder to a GPU notebook. In Kaggle or Colab, install requirements and run:

```bash
pip install -r requirements.txt
python train_pothole.py --data /path/to/pothole-rdd-v1/pothole.yaml --device 0 --epochs 100 --imgsz 960
```

Use a GPU runtime. `best.pt` will be produced beneath
`runs/pothole-rdd-v1/weights/`.

## Calibrate before deployment

Use the untouched `test` split to choose a confidence threshold. Do not assume
the old Hugging Face threshold (`0.65`) is correct for the new model.

```bash
python calibrate_threshold.py \
  --weights runs/pothole-rdd-v1/weights/best.pt \
  --images /path/to/pothole-rdd-v1/images/test \
  --labels /path/to/pothole-rdd-v1/labels/test \
  --device 0 \
  --output threshold-report.json
```

The report selects the threshold with the highest F1 score at IoU 0.50. Review
precision and recall as well; municipal alerts usually prefer a slightly higher
precision threshold to avoid false work orders.

## Deploy to the live backend

Copy the approved model to:

```text
E:\DRONE project\backend\API\models\pothole-rdd-v1.pt
```

Restart `npm run cv:start`. The FastAPI sidecar automatically prefers this
local model and falls back to `DanielsStulpe/pothole-detection` if it is absent
or cannot load. Set `POTHOLE_VIDEO_CONFIDENCE` to the calibrated threshold for
the service session before starting it.

The FastAPI `/health` response will show the active pothole model source.
