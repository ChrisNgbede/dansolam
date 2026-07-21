<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'permissions',
        'is_system',
    ];

    protected function casts(): array
    {
        return [
            'permissions' => 'array',
            'is_system' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (Role $role): void {
            if ($role->slug === 'super-admin') {
                $role->permissions = config('admin_permissions.all', []);
            }
        });
    }

    /**
     * Users that belong to this role.
     */
    public function users()
    {
        return $this->hasMany(User::class);
    }

    /**
     * Check if the role has a given permission.
     */
    public function hasPermission(string $key): bool
    {
        if ($this->slug === 'super-admin') {
            return true;
        }

        return in_array($key, $this->permissions ?? []);
    }
}
