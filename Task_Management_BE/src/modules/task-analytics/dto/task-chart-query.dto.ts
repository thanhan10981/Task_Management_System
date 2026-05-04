import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Matches } from 'class-validator';
import {
  DEFAULT_TASK_CHART_PERIOD,
  TASK_CHART_PERIODS,
} from '../constants/task-chart.constants';
import { TaskChartPeriod } from '../types/task-chart.types';

export class TaskChartQueryDto {
  @ApiPropertyOptional({
    description: 'Chart period filter',
    enum: TASK_CHART_PERIODS,
    example: DEFAULT_TASK_CHART_PERIOD,
    default: DEFAULT_TASK_CHART_PERIOD,
  })
  @IsOptional()
  @IsString()
  @IsIn([...TASK_CHART_PERIODS])
  period?: TaskChartPeriod = DEFAULT_TASK_CHART_PERIOD;

  @ApiPropertyOptional({
    description: 'Filter chart data by a specific project ID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional({
    description:
      'Target month for daily/weekly views in YYYY-MM format. Defaults to current month.',
    example: '2026-04',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'month must be in YYYY-MM format (e.g. 2026-04)',
  })
  month?: string;
}
