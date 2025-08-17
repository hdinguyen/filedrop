import path, { resolve } from 'path';
import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import fastifyStatic from '@fastify/static';
import fastifyCompress from '@fastify/compress';

import { WSClient } from './WSClient.js';
import { ClientManager } from './ClientManager.js';
import { isMessageModel } from './utils/validation.js';
import { MessageType } from '@filedrop/types';
import {
  host,
  maxSize,
  port,
  useProxy,
  appName,
  staticRoot,
} from './config.js';

const clientManager = new ClientManager();
const app = Fastify();
app.register(fastifyCompress);

const manifest = {
  icons: [
    {
      src: 'icon512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any maskable',
    },
  ],
  start_url: '/',
  display: 'standalone',
  theme_color: '#1b1b1d',
  background_color: '#1b1b1d',
  name: appName || 'filedrop',
};
const manifestString = JSON.stringify(manifest);
const maxAge = 30 * 24 * 60 * 60 * 1000;

if (useProxy) {
  const fastifyHttpProxy = (await import('@fastify/http-proxy')).default;
  app.register(fastifyHttpProxy, {
    upstream: 'http://localhost:3000/',
  });
} else {
  const STATIC_ROOT = resolve(staticRoot);

  app.setNotFoundHandler((req, reply) => {
    const split = req.url.split('/');

    if (split.length === 2) {
      // For paths like /xyz we want to send the frontend.
      // This will not interfere with 404 errors for
      // truly not found files.
      reply.sendFile('index.html', STATIC_ROOT);
      return;
    }

    reply.status(404);
    reply.send('Not found');
  });
  app.register(fastifyStatic, {
    root: STATIC_ROOT,
    prefix: '/',
    index: 'index.html',
    cacheControl: false,
  });
  app.register(fastifyStatic, {
    root: path.join(STATIC_ROOT, 'assets'),
    prefix: '/assets',
    cacheControl: true,
    immutable: true,
    maxAge,
    decorateReply: false,
  });
  app.register(fastifyStatic, {
    root: path.join(STATIC_ROOT, 'locales'),
    prefix: '/locales',
    cacheControl: true,
    immutable: true,
    maxAge,
    decorateReply: false,
  });
}

app.get('/manifest.json', (_, res) => {
  res.type('application/json');
  return manifestString;
});

// REST API for sending messages
app.post('/api/send-message', async (request, reply) => {
  try {
    const { networkName, message, senderName } = request.body as {
      networkName: string;
      message: string;
      senderName?: string;
    };

    if (!networkName || !message) {
      reply.status(400).send({ 
        error: 'Missing required fields: networkName and message' 
      });
      return;
    }

    const upperNetworkName = networkName.toUpperCase();
    const networkClients = clientManager.getNetworkClients(upperNetworkName);
    
    if (networkClients.length === 0) {
      reply.status(404).send({ 
        error: `No clients found in network: ${networkName}` 
      });
      return;
    }

    // Create a system message for all clients in the network
    const chatMessage = {
      type: MessageType.CHAT,
      targetId: '', // Will be set per client
      message: `[${senderName || 'API'}] ${message}`,
      direct: false,
      clientId: 'api-sender'
    };

    let sentCount = 0;
    for (const client of networkClients) {
      try {
        const personalizedMessage = {
          ...chatMessage,
          targetId: client.clientId!
        };
        client.send(personalizedMessage);
        sentCount++;
      } catch (error) {
        console.error(`Failed to send message to client ${client.clientId}:`, error);
      }
    }

    reply.send({ 
      success: true, 
      networkName: upperNetworkName,
      clientsFound: networkClients.length,
      messagesSent: sentCount 
    });
  } catch (error) {
    console.error('Error sending message:', error);
    reply.status(500).send({ error: 'Internal server error' });
  }
});

// REST API for getting network information
app.get('/api/networks/:networkName', async (request, reply) => {
  try {
    const { networkName } = request.params as { networkName: string };
    const upperNetworkName = networkName.toUpperCase();
    const networkClients = clientManager.getNetworkClients(upperNetworkName);
    
    reply.send({
      networkName: upperNetworkName,
      clientCount: networkClients.length,
      isProtected: clientManager.isRoomProtected(upperNetworkName),
      clients: networkClients.map(client => ({
        clientId: client.clientId,
        clientName: client.clientName || 'Unknown',
        deviceType: client.deviceType,
        connected: client.readyState === 1
      }))
    });
  } catch (error) {
    console.error('Error getting network info:', error);
    reply.status(500).send({ error: 'Internal server error' });
  }
});

// REST API for creating protected rooms
app.post('/api/rooms/protect', async (request, reply) => {
  try {
    const { networkName, accessCode } = request.body as {
      networkName: string;
      accessCode: string;
    };

    if (!networkName || !accessCode) {
      reply.status(400).send({ 
        error: 'Missing required fields: networkName and accessCode' 
      });
      return;
    }

    if (accessCode.length < 4 || accessCode.length > 32) {
      reply.status(400).send({ 
        error: 'Access code must be between 4 and 32 characters' 
      });
      return;
    }

    const upperNetworkName = networkName.toUpperCase();
    const room = clientManager.createProtectedRoom(upperNetworkName, accessCode);
    
    reply.send({ 
      success: true, 
      networkName: room.networkName,
      createdAt: room.createdAt
    });
  } catch (error) {
    console.error('Error creating protected room:', error);
    reply.status(500).send({ error: 'Internal server error' });
  }
});

// REST API for removing room protection
app.delete('/api/rooms/:networkName/protection', async (request, reply) => {
  try {
    const { networkName } = request.params as { networkName: string };
    const upperNetworkName = networkName.toUpperCase();
    
    const removed = clientManager.removeProtectedRoom(upperNetworkName);
    
    if (removed) {
      reply.send({ 
        success: true, 
        message: `Protection removed from room: ${upperNetworkName}` 
      });
    } else {
      reply.status(404).send({ 
        error: `Room not found or not protected: ${networkName}` 
      });
    }
  } catch (error) {
    console.error('Error removing room protection:', error);
    reply.status(500).send({ error: 'Internal server error' });
  }
});

// REST API for listing protected rooms
app.get('/api/rooms/protected', async (request, reply) => {
  try {
    const protectedRooms = clientManager.getProtectedRooms();
    
    reply.send({
      count: protectedRooms.length,
      rooms: protectedRooms.map(room => ({
        networkName: room.networkName,
        createdAt: room.createdAt,
        accessCount: room.accessCount
      }))
    });
  } catch (error) {
    console.error('Error listing protected rooms:', error);
    reply.status(500).send({ error: 'Internal server error' });
  }
});

app.register(fastifyWebsocket);
app.register(async function (fastify) {
  fastify.get('/ws', { websocket: true }, (connection, req) => {
    const ws = connection.socket;
    const client = new WSClient(ws, req);

    clientManager.sendAppInfo(client);

    ws.on('error', error => {
      console.log('[ERROR (Handled)]', error.message);
    });

    ws.on('message', (data: string) => {
      // Prevents DDoS and abuse.
      if (!data || data.length > maxSize) return;

      try {
        const message = JSON.parse(data);

        if (isMessageModel(message)) {
          clientManager.handleMessage(client, message);
        }
      } catch (e) {}
    });

    ws.on('close', () => {
      clientManager.removeClient(client);
    });
  });
});

app.listen({ host, port });

setInterval(() => {
  clientManager.removeBrokenClients();
}, 1000);

// Ping clients to keep the connection alive (when behind nginx)
setInterval(() => {
  clientManager.pingClients();
}, 5000);

setInterval(() => {
  clientManager.removeInactiveClients();
}, 10000);

console.log(`Server running on ${host}:${port}`);
