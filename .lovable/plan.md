# Correggere gli aggiornamenti senza perdere i bollini

## Obiettivo
Separare definitivamente i dati reali dell'app dal codice Git, preservando il contenuto attuale di `/opt/bollini/data/bollini.json`.

## Modifiche al progetto
- Rimuovere `data/bollini.json` dal versionamento: è un file runtime e non deve essere distribuito né sovrascritto dagli aggiornamenti.
- Aggiungere `data/bollini.json` alle regole di esclusione Git.
- Conservare nel codice i dati iniziali già presenti in `DEFAULT_DATA`, usati automaticamente solo quando il file runtime non esiste.
- Aggiornare `DEPLOY.md` con una procedura di aggiornamento che esegue prima un backup e mantiene proprietario e permessi corretti.

## Procedura una tantum sul server
Prima di scaricare la correzione:

```bash
cd /opt/bollini
sudo systemctl stop bollini
sudo cp data/bollini.json /tmp/bollini.json.backup
sudo rm data/bollini.json
git pull
sudo cp /tmp/bollini.json.backup data/bollini.json
sudo chown www-data:www-data data/bollini.json
npm install
NITRO_PRESET=node-server npm run build
sudo systemctl start bollini
```

Il backup in `/tmp` evita che Git tocchi i bollini, le richieste, i premi e lo storico già presenti. Dopo questa correzione, i successivi `git pull` ignoreranno il file dati.

## Verifica
- Controllare che `git status` non mostri `data/bollini.json` dopo l'uso dell'app.
- Avviare l'app e verificare che totale, storico, impostazioni e richieste esistenti siano ancora presenti.
- Confermare che un successivo aggiornamento possa partire senza conflitti sul file dati.
