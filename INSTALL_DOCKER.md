# Installing Docker Desktop on Windows

## Quick Install Steps

### 1. Download Docker Desktop

Visit: **https://www.docker.com/products/docker-desktop/**

Or direct download: **https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe**

### 2. Run the Installer

1. Double-click the downloaded installer
2. Follow the installation wizard
3. **Important:** Make sure "Use WSL 2 instead of Hyper-V" is checked (recommended)
4. Complete the installation

### 3. Restart Your Computer

Docker Desktop may require a system restart.

### 4. Start Docker Desktop

1. Launch Docker Desktop from the Start menu
2. Accept the terms of service
3. Wait for Docker to start (you'll see a whale icon in the system tray)

### 4. Verify Installation

Open PowerShell and run:
```powershell
docker --version
docker ps
```

You should see Docker version information and an empty container list.

---

## Alternative: Use Existing PostgreSQL/Redis

If you already have PostgreSQL and Redis installed locally, you can skip Docker and update your environment variables:

### PostgreSQL
- Default connection: `postgresql://postgres:password@localhost:5432/kealee?schema=public`
- Update `services/api/.env.local` with your actual credentials

### Redis
- Default connection: `redis://localhost:6379`
- Update `services/api/.env.local` if your Redis is on a different port

---

## Troubleshooting

### WSL 2 Not Installed

If Docker Desktop requires WSL 2:

1. Open PowerShell as Administrator
2. Run:
   ```powershell
   wsl --install
   ```
3. Restart your computer
4. Install Docker Desktop again

### Docker Desktop Won't Start

1. Make sure virtualization is enabled in BIOS
2. Check Windows Features: Enable "Virtual Machine Platform" and "Windows Subsystem for Linux"
3. Restart your computer

### Check WSL 2 Status

```powershell
wsl --status
```

---

## After Installation

Once Docker is installed, you can start the database and Redis:

```powershell
# From the project root
docker-compose up -d

# Verify containers are running
docker ps
```

You should see:
- `kealee-postgres` (PostgreSQL)
- `kealee-redis` (Redis)

---

## Need Help?

- Docker Desktop Documentation: https://docs.docker.com/desktop/install/windows-install/
- Docker Desktop Support: https://docs.docker.com/desktop/troubleshoot/
