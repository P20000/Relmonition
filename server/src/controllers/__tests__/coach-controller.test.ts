import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { deleteConversation, getMessages, streamChat, regenerateResponse, editLatestPrompt } from '../coach-controller';

let dbClientMock: any;
let selectCallCount = 0;

vi.mock('../../tenant-manager', () => {
  return {
    TenantDatabaseManager: class {
      getDatabaseClient() {
        return { client: dbClientMock };
      }
    }
  };
});

vi.mock('../../services/ai/rag-service', () => {
  return {
    queryRelationshipMemoryStream: vi.fn().mockImplementation(async function* () {
      yield 'AI response chunk';
    })
  };
});

describe('AI Coach Session Controller BOLA / IDOR Protections', () => {
  let req: any;
  let res: Partial<Response>;

  beforeEach(() => {
    vi.clearAllMocks();
    selectCallCount = 0;

    const limitFn = vi.fn().mockImplementation(async () => {
      if (selectCallCount === 1) {
        return [{ id: 'session-123', tenantId: 'tenant-123', userId: 'user-123' }];
      }
      return [];
    });

    const orderByFn = vi.fn().mockImplementation(async () => {
      if (selectCallCount === 2) {
        return [{ id: 'msg-1', content: 'hello' }];
      }
      return [];
    });

    const whereFn = vi.fn().mockReturnValue({
      limit: limitFn,
      orderBy: orderByFn
    });

    const fromFn = vi.fn().mockReturnValue({
      where: whereFn,
      orderBy: orderByFn,
      limit: limitFn
    });

    const selectMock = vi.fn().mockImplementation(() => {
      selectCallCount++;
      return { from: fromFn };
    });

    const valuesFn = vi.fn().mockResolvedValue({});
    const insertMock = vi.fn().mockReturnValue({
      values: valuesFn
    });

    const deleteMock = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue({})
    });

    dbClientMock = {
      select: selectMock,
      insert: insertMock,
      delete: deleteMock
    };

    req = {
      user: { userId: 'user-123' },
      tenantId: 'tenant-123',
      params: {},
      body: {},
      headers: {},
      on: vi.fn()
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn(),
      write: vi.fn(),
      end: vi.fn()
    };
  });

  describe('deleteConversation', () => {
    it('should return 403 if user does not own the session', async () => {
      req.params.sessionId = 'session-999';
      // override select mock for BOLA violation test
      dbClientMock.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]) // no session found
          })
        })
      });

      await deleteConversation(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Access Denied: Invalid session context.'
      }));
    });

    it('should delete conversation and messages if user owns the session', async () => {
      req.params.sessionId = 'session-123';

      await deleteConversation(req as Request, res as Response);

      expect(dbClientMock.delete).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Conversation deleted successfully.'
      }));
    });
  });

  describe('getMessages', () => {
    it('should return 403 if user does not own the session', async () => {
      req.params.sessionId = 'session-999';
      dbClientMock.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([])
          })
        })
      });

      await getMessages(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should fetch messages if user owns the session', async () => {
      req.params.sessionId = 'session-123';

      await getMessages(req as Request, res as Response);

      expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ id: 'msg-1' })
      ]));
    });
  });

  describe('streamChat', () => {
    it('should create a new session if no sessionId is provided', async () => {
      req.body = { query: 'How to communicate better?' };

      await streamChat(req as Request, res as Response);

      expect(dbClientMock.insert).toHaveBeenCalled();
      expect(res.write).toHaveBeenCalled();
      expect(res.end).toHaveBeenCalled();
    });

    it('should return 403 if user attempts to stream to a session they do not own', async () => {
      req.body = { sessionId: 'session-999', query: 'How to communicate better?' };
      dbClientMock.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([])
          })
        })
      });

      await streamChat(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should stream response if user owns the session', async () => {
      req.body = { sessionId: 'session-123', query: 'How to communicate better?' };

      await streamChat(req as Request, res as Response);

      expect(res.write).toHaveBeenCalled();
      expect(res.end).toHaveBeenCalled();
    });
  });

  describe('regenerateResponse', () => {
    it('should return 403 if user does not own the session', async () => {
      req.body = { sessionId: 'session-999' };
      dbClientMock.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([])
          })
        })
      });

      await regenerateResponse(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('editLatestPrompt', () => {
    it('should return 403 if user does not own the session', async () => {
      req.body = { sessionId: 'session-999', newQuery: 'New query' };
      dbClientMock.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([])
          })
        })
      });

      await editLatestPrompt(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});
