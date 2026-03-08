type Client = {
  id: string;
  userId: string;
  send: (event: string, data: unknown) => void;
  close: () => void;
};

class SseBroker {
  private rooms = new Map<string, Map<string, Client>>();

  addClient(roomId: string, client: Client) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Map());
    }
    this.rooms.get(roomId)!.set(client.id, client);
    console.log(this.rooms)
  }

  removeClient(roomId: string, clientId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.delete(clientId);
    if (room.size === 0) {
      this.rooms.delete(roomId);
    }
    console.log(this.rooms)
  }

  broadcast(
    roomId: string,
    event: string,
    payload: unknown,
    excludeUserId?: string
  ) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    for (const [, client] of room) {
      if (excludeUserId && client.userId === excludeUserId) continue;

      try {
        client.send(event, payload);
      } catch {
        this.removeClient(roomId, client.id);
      }
    }
    console.log(this.rooms)
  }
}

declare global {
  var __sseBroker__: SseBroker | undefined;
}

export const sseBroker = globalThis.__sseBroker__ ?? new SseBroker();
globalThis.__sseBroker__ = sseBroker;
