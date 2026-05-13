import { MailJobQueueService } from './mail-job-queue.service';
import { MAIL_QUEUE_JOB_NAME } from '../mail.constants';

describe('MailJobQueueService', () => {
  it('enqueues mail with retry options and closes the queue', async () => {
    const queue = {
      add: jest.fn().mockResolvedValue({ id: 'job-1' }),
      close: jest.fn(),
    };
    const service = new MailJobQueueService(queue as any);

    await service.enqueue({ to: 'ada@example.com', subject: 'Hello', text: 'Hi' } as any);

    expect(queue.add).toHaveBeenCalledWith(
      MAIL_QUEUE_JOB_NAME,
      expect.objectContaining({ to: 'ada@example.com' }),
      expect.objectContaining({ attempts: 3, removeOnFail: false }),
    );

    await service.onModuleDestroy();
    expect(queue.close).toHaveBeenCalled();
  });

  it('rethrows queue failures', async () => {
    const error = new Error('queue down');
    const service = new MailJobQueueService({
      add: jest.fn().mockRejectedValue(error),
      close: jest.fn(),
    } as any);

    await expect(service.enqueue({ to: 'ada@example.com' } as any)).rejects.toBe(error);
  });
});
