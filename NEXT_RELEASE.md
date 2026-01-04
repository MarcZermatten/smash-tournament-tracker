# Prochaine Release - Notes de préparation

## 🎨 Nouvelle icône de l'application

### Fichier source
- **Nom**: `Icone_Leon2.png`
- **Emplacement actuel**: À fournir (le fichier doit être placé dans le projet)

### Étapes pour intégrer la nouvelle icône

1. **Placer l'icône source**
   ```
   Copier Icone_Leon2.png dans:
   src-tauri/icons/icon-source.png
   ```

2. **Générer toutes les tailles d'icônes**

   Les icônes suivantes doivent être générées à partir de `Icone_Leon2.png`:

   **PNG (macOS/Linux)**
   - `32x32.png` - 32x32 pixels
   - `64x64.png` - 64x64 pixels (nouveau, à ajouter)
   - `128x128.png` - 128x128 pixels
   - `128x128@2x.png` - 256x256 pixels
   - `icon.png` - 512x512 pixels ou 1024x1024 pixels

   **ICO (Windows)**
   - `icon.ico` - Multi-résolution (16, 32, 48, 256)

   **ICNS (macOS)**
   - `icon.icns` - Contient plusieurs résolutions

   **Windows Store**
   - `Square30x30Logo.png` - 30x30
   - `Square44x44Logo.png` - 44x44
   - `Square71x71Logo.png` - 71x71
   - `Square89x89Logo.png` - 89x89
   - `Square107x107Logo.png` - 107x107
   - `Square142x142Logo.png` - 142x142
   - `Square150x150Logo.png` - 150x150
   - `Square284x284Logo.png` - 284x284
   - `Square310x310Logo.png` - 310x310
   - `StoreLogo.png` - 50x50

3. **Outils recommandés pour la génération**

   **Option 1: Tauri Icon Tool (Recommandé)**
   ```bash
   npm install -g @tauri-apps/cli
   cargo tauri icon path/to/Icone_Leon2.png
   ```
   Cette commande génère automatiquement toutes les tailles nécessaires.

   **Option 2: ImageMagick**
   ```bash
   # Installer ImageMagick
   # Windows: https://imagemagick.org/script/download.php

   # Exemple pour générer une taille
   magick Icone_Leon2.png -resize 32x32 32x32.png
   ```

   **Option 3: Outil en ligne**
   - https://icon.kitchen/ (gratuit, génère tous les formats)
   - https://www.img2go.com/convert-to-ico

4. **Vérification de la configuration**

   Le fichier `src-tauri/tauri.conf.json` référence déjà les icônes:
   ```json
   "icon": [
     "icons/32x32.png",
     "icons/128x128.png",
     "icons/128x128@2x.png",
     "icons/icon.icns",
     "icons/icon.ico"
   ]
   ```
   Aucune modification de configuration n'est nécessaire.

5. **Nettoyage du cache Windows (après installation)**

   Après avoir installé la nouvelle version avec la nouvelle icône, les utilisateurs Windows peuvent avoir besoin de nettoyer le cache d'icônes:
   ```
   Utiliser le script: clear-icon-cache.bat
   Puis désinstaller et réinstaller l'application
   ```

## 📋 Checklist avant la release

- [ ] Placer `Icone_Leon2.png` dans le projet
- [ ] Générer toutes les tailles d'icônes avec `cargo tauri icon`
- [ ] Vérifier visuellement les icônes générées
- [ ] Tester le build avec les nouvelles icônes
- [ ] Créer les installateurs (MSI + NSIS)
- [ ] Tester l'installation sur Windows
- [ ] Vérifier que la nouvelle icône s'affiche correctement
- [ ] Mettre à jour le numéro de version dans `src-tauri/tauri.conf.json`
- [ ] Créer la release GitHub avec les installateurs

## 🔄 Workflow complet

```bash
# 1. Placer la nouvelle icône
cp path/to/Icone_Leon2.png src-tauri/icons/icon-source.png

# 2. Générer toutes les icônes
cd src-tauri
cargo tauri icon icons/icon-source.png

# 3. Vérifier les icônes générées
ls icons/

# 4. Mettre à jour la version (si nécessaire)
# Éditer src-tauri/tauri.conf.json: "version": "1.0.2"

# 5. Builder l'application
cd ..
npm run tauri build

# 6. Commit et release
git add .
git commit -m "Update app icon to Icone_Leon2"
git push origin master
git tag v1.0.2
git push origin v1.0.2
gh release create v1.0.2 --title "..." --notes "..." installer1.msi installer2.exe
```

## 📝 Notes additionnelles

- La nouvelle icône sera visible dès la prochaine installation
- Les utilisateurs existants devront désinstaller et réinstaller pour voir la nouvelle icône
- Le script `clear-icon-cache.bat` aide à forcer Windows à rafraîchir l'icône

---

**Date de création**: 2026-01-04
**Statut**: En attente du fichier Icone_Leon2.png
