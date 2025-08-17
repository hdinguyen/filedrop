export interface ProtectedRoom {
  networkName: string;
  accessCode: string;
  createdAt: Date;
  accessCount: number;
}

export class RoomManager {
  private protectedRooms = new Map<string, ProtectedRoom>();
  private roomCleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up old rooms every hour
    this.roomCleanupInterval = setInterval(() => {
      this.cleanupOldRooms();
    }, 60 * 60 * 1000);
  }

  createProtectedRoom(networkName: string, accessCode: string): ProtectedRoom {
    const upperNetworkName = networkName.toUpperCase();
    const room: ProtectedRoom = {
      networkName: upperNetworkName,
      accessCode,
      createdAt: new Date(),
      accessCount: 0,
    };

    this.protectedRooms.set(upperNetworkName, room);
    console.log(`Created protected room: ${upperNetworkName}`);
    return room;
  }

  isRoomProtected(networkName: string): boolean {
    return this.protectedRooms.has(networkName.toUpperCase());
  }

  validateAccessCode(networkName: string, accessCode: string): boolean {
    const upperNetworkName = networkName.toUpperCase();
    const room = this.protectedRooms.get(upperNetworkName);
    
    if (!room) {
      return false; // Room doesn't exist or isn't protected
    }

    const isValid = room.accessCode === accessCode;
    if (isValid) {
      room.accessCount++;
    }
    
    return isValid;
  }

  removeProtectedRoom(networkName: string): boolean {
    const upperNetworkName = networkName.toUpperCase();
    const existed = this.protectedRooms.has(upperNetworkName);
    this.protectedRooms.delete(upperNetworkName);
    
    if (existed) {
      console.log(`Removed protected room: ${upperNetworkName}`);
    }
    
    return existed;
  }

  getProtectedRooms(): ProtectedRoom[] {
    return Array.from(this.protectedRooms.values());
  }

  private cleanupOldRooms() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    for (const [networkName, room] of this.protectedRooms.entries()) {
      if (room.createdAt < oneDayAgo) {
        this.protectedRooms.delete(networkName);
        console.log(`Cleaned up old protected room: ${networkName}`);
      }
    }
  }

  destroy() {
    if (this.roomCleanupInterval) {
      clearInterval(this.roomCleanupInterval);
    }
  }
}