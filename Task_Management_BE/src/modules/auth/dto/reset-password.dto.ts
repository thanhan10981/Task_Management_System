import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Reset token from reset password link',
    example: 'd8f0d77f-a8a8-41ab-8af7-fdecc14952fe',
  })
  @IsString()
  @IsNotEmpty({ message: 'Reset token is required' })
  resetToken: string;

  @ApiProperty({ description: 'New password', minLength: 6, example: 'newStrongPass123' })
  @IsString()
  @IsNotEmpty({ message: 'New password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  newPassword: string;

  @ApiProperty({ description: 'Confirm new password', minLength: 6, example: 'newStrongPass123' })
  @IsString()
  @IsNotEmpty({ message: 'Confirm password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  confirmPassword: string;
}
