import { ApiPropertyOptional } from '@nestjs/swagger';
import { ThemeMode } from '@prisma/client';
import { IsEnum, IsObject, IsOptional } from 'class-validator';

export class UpdateUserSettingsDto {
  @ApiPropertyOptional({ enum: ThemeMode, example: 'SYSTEM' })
  @IsOptional()
  @IsEnum(ThemeMode)
  theme?: ThemeMode;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  notificationSettings?: Record<string, unknown>;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  privacySettings?: Record<string, unknown>;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  preferences?: Record<string, unknown>;
}
