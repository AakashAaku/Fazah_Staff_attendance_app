import { Test, TestingModule } from '@nestjs/testing';
import { PunchesService } from './punches.service';

describe('PunchesService', () => {
  let service: PunchesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PunchesService],
    }).compile();

    service = module.get<PunchesService>(PunchesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
