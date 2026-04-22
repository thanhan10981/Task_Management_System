import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
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
}
