/**
 * Module imports.
 */
import { ApplyOptions } from '@sapphire/decorators';
import { PaginatedMessage } from '@sapphire/discord.js-utilities';
import { Command, CommandOptions } from '@sapphire/framework';
import { Message, MessageEmbed } from 'discord.js';

@ApplyOptions<CommandOptions>({
	name: 'queue',
	description: 'Shows the music queue.',
	fullCategory: ['music']
})
export class UserCommand extends Command {
	public async messageRun(message: Message) {
		if (!message.guild) return;
		if (!message.guild) return;
		const erelaPlayer = this.container.client.players.get(message.guild.id);
		const embedReply = new MessageEmbed();
		const { channel: userVoiceChannel } = message.member?.voice!;
		const { channel: botVoiceChannel } = message.guild.me?.voice!;

		try {
			if (!userVoiceChannel) {
				embedReply.setDescription(
					'You have to be connected to a voice channel before you can use this command!'
				);
				return message.reply({ embeds: [embedReply] });
			}

			if (userVoiceChannel.id !== botVoiceChannel?.id) {
				embedReply.setDescription(
					'You need to be in the same voice channel as the bot before you can use this command!'
				);
				return message.reply({ embeds: [embedReply] });
			}

			if (!erelaPlayer) {
				embedReply.setDescription(
					"There isn't an active player on this server!"
				);
				return message.reply({ embeds: [embedReply] });
			}

			if (!erelaPlayer.queue.length) {
				embedReply.setDescription(
					`${
						erelaPlayer.queue.current
							? `__Now Playing:__\n${erelaPlayer.queue.current.title} - ${erelaPlayer.queue.current.requester}\n\n`
							: ''
					}The queue is empty.`
				);
				return message.reply({ embeds: [embedReply] });
			}

			/**
			 * This is a mess but it works
			 */
			const trackNamesArr = erelaPlayer?.queue.map(
				(track, i) =>
					`\`${i + 1}.\` ${track.title} - [${track.requester}]`
			);

			const trackNameArrChunks = trackNamesArr.reduce(
				(resultArray: string[][], item, index) => {
					const chunkIndex = Math.floor(index / 10);
					if (!resultArray[chunkIndex]) {
						resultArray[chunkIndex] = [];
					}
					resultArray[chunkIndex].push(item);
					return resultArray;
				},
				[]
			);

			const queueTextArrr = [];

			for (const item of trackNameArrChunks) {
				const trackName = item.join('\n');
				queueTextArrr.push([trackName]);
			}

			const paginatedMessage = new PaginatedMessage({
				template: new MessageEmbed()
			});

			queueTextArrr.forEach((textChunk) =>
				paginatedMessage.addPageEmbed((embed) =>
					embed.setDescription(
						`__Now Playing:__\n[${erelaPlayer.queue.current?.title}](${erelaPlayer.queue.current?.uri}) - ${erelaPlayer.queue.current?.requester}\n\n${textChunk[0]}`
					)
				)
			);
			return await paginatedMessage.run(message, message.author);
		} catch (error: any) {
			this.container.client.logger.error(
				`There was an unexpected error in command "${this.name}"`,
				error
			);

			embedReply.setDescription(
				'There was an unexpected error while processing the command, try again later.'
			);
			return message.reply({ embeds: [embedReply] });
		}
	}
}
