/**
 * Cryptographically secure temporary password generation.
 *
 * Historically two weak patterns existed:
 *  - team-passwords used Math.random() (predictable V8 PRNG)
 *  - manager-accounts used `${publicTeamName}${6 digits}` (~20 bits entropy,
 *    team name is public information)
 *
 * Both now use this helper: 12 chars from an unambiguous alphabet (Crockford-
 * style, no 0/O/1/I), grouped in 3-char blocks. ~62 bits entropy.
 *
 * Pure server-only.
 */

import { randomInt } from 'crypto';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 32 symbols, no ambiguous pairs
const GROUPS = 4;
const GROUP_SIZE = 3;

export function generateTempPassword(): string {
  const blocks: string[] = [];
  for (let g = 0; g < GROUPS; g++) {
    let block = '';
    for (let i = 0; i < GROUP_SIZE; i++) {
      block += ALPHABET[randomInt(0, ALPHABET.length)];
    }
    blocks.push(block);
  }
  return blocks.join('-');
}
