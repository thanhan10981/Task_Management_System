import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class TriggerTaskReminderDto {
  @ApiProperty({
    description: 'Minutes before deadline to mention in reminder mail',
    example: 60,
  })
  @IsInt()
  @Min(1)
  thresholdMinutes: number;
}
