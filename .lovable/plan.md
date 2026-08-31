# Piano: risolvere conflitto git su `src/routeTree.gen.ts`

## Problema
`git pull` si blocca perché il file generato `src/routeTree.gen.ts` è stato modificato localmente e andrebbe sovrascritto dal merge.

## Soluzione
`src/routeTree.gen.ts` viene rigenerato automaticamente da TanStack Start, quindi è sicuro scartare le modifiche locali e poi fare il pull.

## Passaggi
1. Nella directory `/opt/bollini`, ripristinare il file generato alla versione del repository:
   ```bash
   git checkout -- src/routeTree.gen.ts
   ```
2. Eseguire di nuovo il pull:
   ```bash
   git pull
   ```
3. Se il pull va a buon fine, reinstallare le dipendenze e ricompilare per Node:
   ```bash
   npm install
   NITRO_PRESET=node-server npm run build
   ```
4. Riavviare il servizio:
   ```bash
   sudo systemctl restart bollini
   ```

## Nota
Se in futuro il conflitto dovesse ripetersi, si può usare direttamente `git reset --hard HEAD` prima del pull, purché non ci siano modifiche locali importanti (in questo progetto i dati stanno in `/opt/bollini/data/`, non nel codice).
