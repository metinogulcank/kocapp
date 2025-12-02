#!/bin/bash

# 🚀 KocApp - Hızlı Deployment Script
# Bu script'i cPanel'de çalıştırarak hızlı deployment yapabilirsiniz

echo "🚀 KocApp Deployment Başlatılıyor..."

# Renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Hata kontrolü
set -e

# Frontend Build
echo -e "${YELLOW}📦 Frontend build ediliyor...${NC}"
cd /home/$(whoami)/kocapp
npm install
npm run build:production
echo -e "${GREEN}✅ Frontend build tamamlandı${NC}"

# Backend Kurulumu
echo -e "${YELLOW}🖥️ Backend kurulumu yapılıyor...${NC}"
cd /home/$(whoami)/kocapp-server
npm install --production
echo -e "${GREEN}✅ Backend kurulumu tamamlandı${NC}"

# PM2 ile Başlatma
echo -e "${YELLOW}🔄 PM2 ile uygulama başlatılıyor...${NC}"
pm2 stop kocapp-server 2>/dev/null || true
pm2 start ecosystem.config.js --env production
pm2 save
echo -e "${GREEN}✅ PM2 ile uygulama başlatıldı${NC}"

# Dosya İzinleri
echo -e "${YELLOW}🔐 Dosya izinleri ayarlanıyor...${NC}"
chmod -R 755 /home/$(whoami)/public_html
chmod 644 /home/$(whoami)/public_html/.htaccess
echo -e "${GREEN}✅ Dosya izinleri ayarlandı${NC}"

# Durum Kontrolü
echo -e "${YELLOW}📊 Uygulama durumu kontrol ediliyor...${NC}"
pm2 status
echo -e "${GREEN}✅ Deployment tamamlandı!${NC}"

echo -e "${GREEN}"
echo "🎉 KocApp başarıyla deploy edildi!"
echo "🌐 Frontend: https://vedatdaglarmuhendislik.com.tr"
echo "🖥️ Backend: https://api.vedatdaglarmuhendislik.com.tr"
echo "📊 PM2 Status: pm2 status"
echo "📝 Logs: pm2 logs kocapp-server"
echo -e "${NC}"
