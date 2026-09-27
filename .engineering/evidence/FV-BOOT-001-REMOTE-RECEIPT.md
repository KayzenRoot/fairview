# FV-BOOT-001 remote Evidence Bundle (non-secret index)
Implementation head: `cbca78a8ea0d963cbf4c646621d5ea8f15599d08`
Base: `547d42121698cd35f2d41fc7675376e8ffb02121`
Run: https://github.com/KayzenRoot/fairview/actions/runs/36335992178
Three exact-head GitHub Actions jobs: SUCCESS; full pinned GEF v1.0.0 validation + npm high audit SUCCESS, Ubuntu module harness and source/security checks SUCCESS, Windows PowerShell parser and unit contracts SUCCESS.
Cross-platform sourcepack_sha256: `99fc42659accedd9d5a4e7464c6aef0d424b9bcfabb922b638223b5827025ab8`
CI artifact digest: `sha256:58931bfb4631e5276e1d5f4a0d43647237513ae43d48d6f24e751aaba721bafa`
Audit: https://github.com/KayzenRoot/fairview/pull/2#issuecomment-5857992894 (owner self-audit, not independent).
Intermediate failed run on `ab55097...` was caused by untrimmed textual HEAD after switching binary NUL diff; code corrected on `cbca78a...`, final CI green. Added deletion/rename test impact coverage. No automated trading functionality exists.
Open blockers: HIVE actual local Windows install/semantic provider and GitHub admin issue #3. This index is historical evidence of the exact implementation head, not an automatic claim that subsequent checkpoint commits passed.