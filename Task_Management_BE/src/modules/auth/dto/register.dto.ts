import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ description: 'Full name of the new user', example: 'Nguyen Van A' })
  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  @MinLength(2, { message: 'Full name must be at least 2 characters' })
  @MaxLength(150, { message: 'Full name is too long' })
  fullName: string;

  @ApiProperty({ description: 'User email', example: 'nguyenvana@example.com' })
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({ description: 'Account password', example: '123456', minLength: 6 })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;

  @ApiProperty({ description: 'Must match password', example: '123456' })
  @IsString()
  @IsNotEmpty({ message: 'Please confirm your password' })
  @MinLength(1, { message: 'Please confirm your password' })
  confirmPassword: string;
}
