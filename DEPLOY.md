# Bollini — installazione sul tuo server Debian (Proxmox)

App web: bacheca punti per tua figlia (`/`) + area genitori protetta da PIN (`/admin`).
I dati sono salvati in un semplice file JSON sul server: nessun database da installare.

---

## 0) Cosa ti serve

- La VM Debian su Proxmox, raggiungibile in SSH
- Un utente con `sudo`
- Il codice di questo progetto (da GitHub, vedi punto 2)

## 1) Prepara la VM

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl nginx
# Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # deve stampare v22.x
```

## 2) Scarica il progetto

In Lovable: **GitHub → Connect / Push** per esportare il codice, poi sulla VM:

```bash
sudo mkdir -p /opt/bollini && sudo chown $USER:$USER /opt/bollini
git clone https://github.com/TUO-UTENTE/TUO-REPO.git /opt/bollini
cd /opt/bollini
npm install
```

## 3) Configura le variabili

```bash
cd /opt/bollini
nano .env
```

Contenuto (cambia i valori!):

```
ADMIN_PIN=4821
SESSION_SECRET=incolla-qui-una-stringa-casuale-lunga-almeno-32-caratteri
DATA_DIR=/opt/bollini/data
PORT=3000
COOKIE_SECURE=false
```

Per generare il segreto: `openssl rand -hex 32`
(metti `COOKIE_SECURE=true` solo quando avrai HTTPS, punto 7).

## 4) Compila per Node

Il build di default è pensato per il cloud: qui forziamo il target Node.

```bash
cd /opt/bollini
NITRO_PRESET=node-server npm run build
```

Prova subito:

```bash
set -a && . ./.env && set +a
node .output/server/index.mjs
```

Apri `http://IP-DELLA-VM:3000` dal browser. Se vedi la bacheca, `Ctrl+C` e prosegui.

## 5) Servizio systemd (parte da solo al riavvio)

```bash
sudo nano /etc/systemd/system/bollini.service
```

```ini
[Unit]
Description=Bollini
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/bollini
EnvironmentFile=/opt/bollini/.env
ExecStart=/usr/bin/node /opt/bollini/.output/server/index.mjs
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo mkdir -p /opt/bollini/data
sudo chown -R www-data:www-data /opt/bollini/data
sudo chmod 600 /opt/bollini/.env && sudo chown www-data:www-data /opt/bollini/.env
sudo systemctl daemon-reload
sudo systemctl enable --now bollini
sudo systemctl status bollini      # deve essere "active (running)"
```

Log in caso di problemi: `journalctl -u bollini -f`

## 6) Nginx davanti all'app

```bash
sudo nano /etc/nginx/sites-available/bollini
```

```nginx
server {
    listen 80;
    server_name bollini.lukinetto.it;   # o l'IP della VM

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/bollini /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## 7) HTTPS (se esponi su internet)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d bollini.lukinetto.it
# poi metti COOKIE_SECURE=true nel .env e:
sudo systemctl restart bollini
```

## 8) Aggiornare l'app dopo modifiche in Lovable

```bash
cd /opt/bollini
git pull
npm install
NITRO_PRESET=node-server npm run build
sudo systemctl restart bollini
```

## 9) Backup dei dati

Tutto sta in `/opt/bollini/data/bollini.json`:

```bash
# backup giornaliero alle 3:00
(crontab -l 2>/dev/null; echo "0 3 * * * cp /opt/bollini/data/bollini.json /opt/bollini/data/backup-\$(date +\%F).json") | crontab -
```

---

### Uso quotidiano

- Tua figlia apre l'indirizzo e vede punti, azioni e premi.
- Tu vai su `/admin`, inserisci il PIN e con un tocco assegni i bollini o scali un premio.
- In "Impostazioni" cambi nome, azioni, premi e relativi valori.
