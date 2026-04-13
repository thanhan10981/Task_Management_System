import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class CreateUserDto {
  @ApiProperty({ description: 'Full name', example: 'Tran Thi B' })
  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  @MinLength(2, { message: 'Full name must be at least 2 characters' })
  @MaxLength(150, { message: 'Full name is too long' })
  fullName: string;

  @ApiProperty({ description: 'User email', example: 'tranthib@example.com' })
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @MaxLength(255, { message: 'Email is too long' })
  email: string;

  @ApiPropertyOptional({ description: 'Password for local auth', example: '123456', minLength: 6 })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password?: string;

  @ApiPropertyOptional({ description: 'Avatar image URL', example: 'https://example.com/avatar.png' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({ description: 'Cover image URL', example: 'https://example.com/cover.png' })
  @IsOptional()
  @IsString()
  coverUrl?: string;

  @ApiPropertyOptional({ description: 'Job title', example: 'Backend Developer' })
  @IsOptional()
  @IsString()
  @MaxLength(120, { message: 'Job title must be at most 120 characters' })
  jobTitle?: string;

  @ApiPropertyOptional({ description: 'Phone number', example: '0123456789' })
  @IsOptional()
  @IsString()
  @MaxLength(30, { message: 'Phone must be at most 30 characters' })
  phone?: string;

  @ApiPropertyOptional({ description: 'Short biography', example: 'Building APIs with NestJS' })
  @IsOptional()
  @IsString()
  bio?: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'Full name', example: 'Tran Thi B Updated' })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Full name must be at least 2 characters' })
  @MaxLength(150, { message: 'Full name is too long' })
  fullName?: string;

  @ApiPropertyOptional({ description: 'User email', example: 'tranthib.updated@example.com' })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email address' })
  @MaxLength(255, { message: 'Email is too long' })
  email?: string;

  @ApiPropertyOptional({ description: 'Password for local auth', example: '123456', minLength: 6 })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password?: string;

  @ApiPropertyOptional({ description: 'Avatar image URL', example: 'https://example.com/avatar-new.png' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({ description: 'Cover image URL', example: 'https://example.com/cover-new.png' })
  @IsOptional()
  @IsString()
  coverUrl?: string;

  @ApiPropertyOptional({ description: 'Job title', example: 'Tech Lead' })
  @IsOptional()
  @IsString()
  @MaxLength(120, { message: 'Job title must be at most 120 characters' })
  jobTitle?: string;

  @ApiPropertyOptional({ description: 'Phone number', example: '0987654321' })
  @IsOptional()
  @IsString()
  @MaxLength(30, { message: 'Phone must be at most 30 characters' })
  phone?: string;

  @ApiPropertyOptional({ description: 'Short biography', example: 'Leading backend architecture' })
  @IsOptional()
  @IsString()
  bio?: string;
}

export class UserQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search by fullName, email, phone, jobTitle', example: 'tran' })
  @IsOptional()
  @IsString()
  search?: string;
}
