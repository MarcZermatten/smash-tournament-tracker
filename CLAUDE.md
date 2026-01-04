# smash-tournament-tracker

## Configuration Claude Code (par Leon)

Ce projet est configure pour utiliser Claude Code via Leon.

## Securite

### Zones Protegees (INTERDIT)
```
C:\Windows\**           C:\Program Files\**
C:\ProgramData\**       C:\Users\*\AppData\Local\Microsoft\**
```

### Zones Sensibles (DEMANDER CONFIRMATION)
```
.ssh/   .aws/   .env   *credentials*   *secret*   *.pem   *.key
```

### Zone de Travail Autorisee
```
C:\\Users\\Marc\\Leon\\projets\\smash-tournament-tracker\**  (ce projet uniquement)
```

### Commandes Interdites
`rm -rf /`, `del /f /s /q C:\`, `git push --force main`, `format`, `diskpart`

**Regle d'or** : En cas de doute -> DEMANDER avant d'executer.

---

## Conventions de Code

### Bonnes Pratiques
- Code propre et lisible
- Noms de variables explicites
- Commentaires pour la logique complexe
- Pas de secrets dans le code

### Fichiers a Ne Jamais Modifier
- `package-lock.json` (auto-genere)
- `Cargo.lock` (auto-genere)
- `.git/` (gere par Git)

## Agents Disponibles

Ce projet utilise les agents Claude Code standards :
- **code-reviewer** - Revue de code apres modifications
- **error-resolver** - Resolution d'erreurs et debug
- **git-assistant** - Aide Git (commits, merges, conflits)

Les agents sont definis dans `.claude/agents/`.

## Commandes Leon

- `/save` - Commit + push les changements
- `/checkpoint` - Sauvegarder l'etat de la session
