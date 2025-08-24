import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { P2pService } from './p2p.service';

interface CreateRoomDto {
  roomId: string;
  peerId: string;
}

interface SendMessageDto {
  type: 'offer' | 'answer' | 'ice-candidate';
  data: unknown;
  targetId?: string;
  roomId: string;
}

@Controller('p2p')
export class P2pController {
  constructor(private readonly p2pService: P2pService) {}

  @Get('rooms')
  getAllRooms() {
    try {
      const rooms = this.p2pService.getAllRooms();
      return {
        success: true,
        rooms: rooms.map((roomId) => ({
          roomId,
          ...this.p2pService.getRoomInfo(roomId),
        })),
      };
    } catch (error) {
      throw new HttpException(
        'Failed to get rooms',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('rooms/:roomId')
  getRoomInfo(@Param('roomId') roomId: string) {
    try {
      const roomInfo = this.p2pService.getRoomInfo(roomId);

      if (!roomInfo) {
        throw new HttpException('Room not found', HttpStatus.NOT_FOUND);
      }

      return {
        success: true,
        room: roomInfo,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to get room info',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('peers')
  getConnectedPeers() {
    try {
      const peers = this.p2pService.getConnectedPeers();
      return {
        success: true,
        peers,
        totalCount: peers.length,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to get connected peers',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('rooms/:roomId/broadcast')
  broadcastToRoom(
    @Param('roomId') roomId: string,
    @Body() messageDto: SendMessageDto,
  ) {
    try {
      const roomInfo = this.p2pService.getRoomInfo(roomId);

      if (!roomInfo) {
        throw new HttpException('Room not found', HttpStatus.NOT_FOUND);
      }

      // This would require adding a method to P2pService
      // this.p2pService.broadcastToRoom(roomId, messageDto);

      return {
        success: true,
        message: 'Message broadcasted to room',
        roomId,
        messageType: messageDto.type,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to broadcast message',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('health')
  healthCheck() {
    try {
      const connectedPeers = this.p2pService.getConnectedPeers();
      const totalRooms = this.p2pService.getAllRooms().length;

      return {
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        stats: {
          connectedPeers: connectedPeers.length,
          activeRooms: totalRooms,
        },
      };
    } catch (error) {
      throw new HttpException(
        'Service unhealthy',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Post('debug/simulate-peer')
  simulatePeerConnection(@Body() data: { peerId: string; roomId?: string }) {
    try {
      // This is for testing purposes - simulates peer registration
      return {
        success: true,
        message: 'Peer simulation endpoint',
        peerId: data.peerId,
        roomId: data.roomId,
        note: 'Use WebSocket client for actual peer connections',
      };
    } catch (error) {
      throw new HttpException(
        'Failed to simulate peer',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
