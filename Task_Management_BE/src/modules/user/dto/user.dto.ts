import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  @MinLength(2, { message: 'Full name must be at least 2 characters' })
  @MaxLength(150, { message: 'Full name is too long' })
  fullName: string;

  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @MaxLength(255, { message: 'Email is too long' })
  email: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  coverUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120, { message: 'Job title must be at most 120 characters' })
  jobTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30, { message: 'Phone must be at most 30 characters' })
  phone?: string;

  @IsOptional()
  @IsString()
  bio?: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Full name must be at least 2 characters' })
  @MaxLength(150, { message: 'Full name is too long' })
  fullName?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Invalid email address' })
  @MaxLength(255, { message: 'Email is too long' })
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  coverUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120, { message: 'Job title must be at most 120 characters' })
  jobTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30, { message: 'Phone must be at most 30 characters' })
  phone?: string;

  @IsOptional()
  @IsString()
  bio?: string;
}

export class UserQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;
}
