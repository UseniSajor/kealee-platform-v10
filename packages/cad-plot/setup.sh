#!/usr/bin/env bash
# Creates the cad-plot virtualenv (docs/decisions/dxf-master-cad-plot.md).
set -euo pipefail
cd "$(dirname "$0")"
python3 -m venv .venv
.venv/bin/pip install -q -r requirements.txt
.venv/bin/python -c "import ezdxf; print('cad-plot ready, ezdxf', ezdxf.__version__)"
