import { route as report } from '../../src/routes/api/v1/report';
import { reportService } from '../../src/services';
import { TargetType } from '@vulps22/project-encourage-types';

jest.mock('../../src/services', () => ({
  reportService: {
    createReport: jest.fn(),
  },
}));

const mockReq = (body: any) => ({ body } as any);
const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('POST /api/v1/report', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 when senderId is missing', async () => {
    const req = mockReq({ offenderId: '42', type: TargetType.Question, serverId: '999' });
    const res = mockRes();
    await report.post!(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing required fields: senderId, offenderId, type, serverId' });
  });

  it('should return 400 when offenderId is missing', async () => {
    const req = mockReq({ senderId: '111', type: TargetType.Question, serverId: '999' });
    const res = mockRes();
    await report.post!(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing required fields: senderId, offenderId, type, serverId' });
  });

  it('should return 400 when type is missing', async () => {
    const req = mockReq({ senderId: '111', offenderId: '42', serverId: '999' });
    const res = mockRes();
    await report.post!(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing required fields: senderId, offenderId, type, serverId' });
  });

  it('should return 400 when serverId is missing', async () => {
    const req = mockReq({ senderId: '111', offenderId: '42', type: TargetType.Question });
    const res = mockRes();
    await report.post!(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing required fields: senderId, offenderId, type, serverId' });
  });

  it('should return success with reportId on valid request', async () => {
    const mockReport = { id: 1, type: TargetType.Question };
    (reportService.createReport as jest.Mock).mockResolvedValue(mockReport);

    const req = mockReq({
      senderId: '111',
      offenderId: '42',
      type: TargetType.Question,
      serverId: '999',
      content: 'Some content',
      reason: 'Spam',
    });
    const res = mockRes();
    await report.post!(req, res);

    expect(reportService.createReport).toHaveBeenCalledWith('111', '42', 'Some content', TargetType.Question, '999', 'Spam');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, reportId: 1 });
  });

  it('should use null for content when not provided', async () => {
    const mockReport = { id: 2, type: TargetType.User };
    (reportService.createReport as jest.Mock).mockResolvedValue(mockReport);

    const req = mockReq({ senderId: '111', offenderId: '42', type: TargetType.User, serverId: '999' });
    const res = mockRes();
    await report.post!(req, res);

    expect(reportService.createReport).toHaveBeenCalledWith('111', '42', null, TargetType.User, '999', undefined);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, reportId: 2 });
  });

  it('should return 500 when service throws an error', async () => {
    (reportService.createReport as jest.Mock).mockRejectedValue(new Error('DB failure'));

    const req = mockReq({
      senderId: '111',
      offenderId: '42',
      type: TargetType.Question,
      serverId: '999',
    });
    const res = mockRes();
    await report.post!(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to create report' });
  });
});
