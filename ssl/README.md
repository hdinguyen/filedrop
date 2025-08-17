# SSL Certificates

Place your SSL certificates in this directory:

- `fullchain.pem` - Full certificate chain
- `privkey.pem` - Private key

## For Let's Encrypt certificates:

```bash
# If you have certbot installed:
sudo cp /etc/letsencrypt/live/drop.nguyenh.work/fullchain.pem /Users/nguyenh/work/filedrop/ssl/
sudo cp /etc/letsencrypt/live/drop.nguyenh.work/privkey.pem /Users/nguyenh/work/filedrop/ssl/
sudo chown $(whoami):$(whoami) /Users/nguyenh/work/filedrop/ssl/*.pem
```

## Test certificates:
```bash
openssl x509 -in fullchain.pem -text -noout
```