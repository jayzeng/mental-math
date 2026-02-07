
import React from 'react';
import { CategoryType, CategoryInfo, StuffyBadge } from './types';

export const CATEGORIES: CategoryInfo[] = [
  {
    id: CategoryType.ADDITION,
    title: 'Bigger Addition',
    icon: '➕',
    color: 'bg-blue-600',
    description: 'Master rounding & splitting!',
    example: '68 + 47 → 68 + 50 - 3 = 115'
  },
  {
    id: CategoryType.SUBTRACTION,
    title: 'Multi-Step Subtraction',
    icon: '➖',
    color: 'bg-rose-600',
    description: 'Try the "Counting Up" strategy.',
    example: '250 - 97 → 97 + 3 = 100, then + 150 = 153'
  },
  {
    id: CategoryType.MULT_BREAKDOWN,
    title: 'Mental Breakdown',
    icon: '✖️',
    color: 'bg-amber-500',
    description: 'Split numbers to multiply easier.',
    example: '23 × 5 = (20 × 5) + (3 × 5) = 115'
  },
  {
    id: CategoryType.MULT_NEAR,
    title: 'Near-10 Mastery',
    icon: '🎯',
    color: 'bg-emerald-600',
    description: 'Use 10s and 100s as your anchor.',
    example: '19 × 6 = (20 × 6) - 6 = 114'
  },
  {
    id: CategoryType.DIVISION,
    title: 'Division Explorer',
    icon: '➗',
    color: 'bg-indigo-600',
    description: 'Find the facts and the remainders.',
    example: '65 ÷ 6 = (6 × 10) + 5'
  },
  {
    id: CategoryType.FRACTIONS,
    title: 'Fraction Power',
    icon: '🧩',
    color: 'bg-purple-600',
    description: 'Halves, Quarters, and Three Quarters.',
    example: 'Quarter of 80 = 80 ÷ 4 = 20'
  },
  {
    id: CategoryType.ESTIMATION,
    title: 'Estimation Champ',
    icon: '🔢',
    color: 'bg-orange-600',
    description: 'Build your "Number Sense".',
    example: '49 + 73 ≈ 50 + 70 = 120'
  }
];

export const STUFFY_BADGES: StuffyBadge[] = [
  { id: '1', emoji: '🧸', name: 'Teddy Hugs' },
  { id: '2', emoji: '🐰', name: 'Pinky Bunny' },
  { id: '3', emoji: '🐱', name: 'Calico Kitty' },
  { id: '4', emoji: '🐶', name: 'Spotted Pup' },
  { id: '5', emoji: '🦊', name: 'Red Foxie' },
  { id: '6', emoji: '🐼', name: 'Panda Pal' },
  { id: '7', emoji: '🐨', name: 'Koala Snuggle' },
  { id: '8', emoji: '🦁', name: 'Brave Lion' },
  { id: '9', emoji: '🐯', name: 'Tiny Tiger' },
  { id: '10', emoji: '🐸', name: 'Ribbit Frog' },
  { id: '11', emoji: '🐵', name: 'Cheeky Monk' },
  { id: '12', emoji: '🦄', name: 'Magic Uni' },
  { id: '13', emoji: '🐲', name: 'Baby Dragon' },
  { id: '14', emoji: '🐧', name: 'Pompom Peng' },
  { id: '15', emoji: '🐥', name: 'Yellow Chick' },
  { id: '16', emoji: '🦉', name: 'Wise Hoot' },
  { id: '17', emoji: '🐝', name: 'Buzzy Bee' },
  { id: '18', emoji: '🐢', name: 'Slow Shell' },
  { id: '19', emoji: '🐘', name: 'Blue Ellie' },
  { id: '20', emoji: '🐙', name: 'Inky Octo' },
  { id: '21', emoji: '🐋', name: 'Baby Whale' },
  { id: '22', emoji: '🦩', name: 'Fancy Flam' },
  { id: '23', emoji: '🦥', name: 'Sleepy Sloth' },
  { id: '24', emoji: '🦔', name: 'Prickly Hedg' },
  { id: '25', emoji: '🦌', name: 'Sweet Deer' },
];
