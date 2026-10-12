SEEDS GARDEN IMAGE INSTALLER

1. In Codespaces, open the seeds-life-skills app folder.
2. Upload/extract the ZIP into that folder (it creates a seeds_garden_integration subfolder).
3. Run: python seeds_garden_integration/install_garden.py
4. Run: npx expo start --web
5. Check My Garden; then git add app/garden.jsx components/GardenFlowerAssets.js assets/garden && git commit -m "Add six illustrated garden flowers" && git push origin main

Existing garden Firestore documents and practice logs are unchanged.
A backup of app/garden.jsx is made automatically.
Custom flowers can later be displayed using customStages URLs saved per plant.
