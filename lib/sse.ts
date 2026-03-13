interface SSEClient {
  controller: ReadableStreamDefaultController;
  id: string;
}

const clients = new Set<SSEClient>();

export function addClient(controller: ReadableStreamDefaultController): string {
  const id = crypto.randomUUID();
  clients.add({ controller, id });
  return id;
}

export function removeClient(id: string) {
  for (const client of clients) {
    if (client.id === id) {
      clients.delete(client);
      break;
    }
  }
}

export function broadcast(event: string, data: object) {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  const encoded = new TextEncoder().encode(message);
  const stale: SSEClient[] = [];
  for (const client of clients) {
    try {
      client.controller.enqueue(encoded);
    } catch {
      stale.push(client);
    }
  }
  stale.forEach(c => clients.delete(c));
}

export function sendToClient(clientId: string, event: string, data: object) {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  const encoded = new TextEncoder().encode(message);
  for (const client of clients) {
    if (client.id === clientId) {
      try {
        client.controller.enqueue(encoded);
      } catch {
        clients.delete(client);
      }
      break;
    }
  }
}

export function getClientCount(): number {
  return clients.size;
}
