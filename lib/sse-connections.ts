/**
 * Registro compartido de conexiones SSE activas.
 *
 * Permite que el endpoint de eventos escriba directamente
 * a los clientes SSE conectados sin esperar el polling.
 *
 * En producción serverless, reemplazar por Redis Pub/Sub.
 */

interface SSEClient {
  write: (data: string) => void;
  close: () => void;
}

// usuarioId → Set de conexiones activas
const connections = new Map<string, Set<SSEClient>>();

export function registrarConexion(usuarioId: string, client: SSEClient): () => void {
  if (!connections.has(usuarioId)) {
    connections.set(usuarioId, new Set());
  }
  connections.get(usuarioId)!.add(client);

  // Retornar función de limpieza
  return () => {
    const set = connections.get(usuarioId);
    if (set) {
      set.delete(client);
      if (set.size === 0) connections.delete(usuarioId);
    }
  };
}

export function enviarACliente(usuarioId: string, data: string): boolean {
  const clients = connections.get(usuarioId);
  if (!clients || clients.size === 0) return false;

  let enviado = false;
  clients.forEach((client) => {
    try {
      client.write(data);
      enviado = true;
    } catch {
      // Cliente desconectado, eliminar
      clients.delete(client);
    }
  });

  if (clients.size === 0) connections.delete(usuarioId);
  return enviado;
}

export function enviarAMultiplesClientes(usuarioIds: string[], data: string): void {
  for (const uid of usuarioIds) {
    enviarACliente(uid, data);
  }
}

export function tieneConexionesActivas(usuarioId: string): boolean {
  return (connections.get(usuarioId)?.size ?? 0) > 0;
}
