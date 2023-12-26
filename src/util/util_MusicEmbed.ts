import { Queue, RepeatMode, Song } from "@jadestudios/discord-music-player";
import { EmbedAuthorData, Message, MessageEmbed, TextChannel } from "discord.js";

export enum MessageOptions {
	error = 0,
	addmusic = 1,
	nowplaying = 2,
	other = 3,
	skip = 4,
}

enum MessageEmoji {
	on = '🟢',
	off = '🔴'
}

export class MusicEmbed {

	private channel: TextChannel;
	private message: Message | undefined;
	private song: Song | undefined;
	private previous: string;
	private sendLock: boolean;

	constructor(channel: TextChannel) {
		this.channel = channel;
		this.message = undefined;
		this.song = undefined;
		this.previous = '\u200B';
		this.sendLock = false;
	}

	public send(option: MessageOptions, args: { song?: Song, queue: Queue, note?: string }) {
		if (this.channel.guild.me?.isCommunicationDisabled()) return; //No response during timeout
		
		if (args.queue.songs.length === 0) {
			this.song = undefined
		} else {
			this.song = args.queue.nowPlaying;
		}

		if (!this.message) { //First case
			if (!this.sendLock) {
				this.sendLock = true
				this.channel.send({ embeds: [this.createMessage(option, args)] }).then(message => {
					this.message = message;
					this.sendLock = false;
				});
			}

		} else {
			if (this.channel.lastMessageId !== this.message.id) {
				if (!this.sendLock) {
					this.sendLock = true
					this.message.delete();
					this.channel.send({ embeds: [this.createMessage(option, args)] }).then(message => {
						this.message = message;
						this.sendLock = false;
					});
				}
			} else {
				this.message.edit({ embeds: [this.createMessage(option, args)] });
			}
		}
	}

	private createMessage(option: MessageOptions, args: { song?: Song, queue: Queue, note?: string }): MessageEmbed {
		let embed: MessageEmbed;
		switch (option) {
			case MessageOptions.error:
				embed = this.createEmbed(args.queue);
				this.previous = `Error: ${args.note}`
				break;
			case MessageOptions.nowplaying:
				embed = this.createEmbed(args.queue);
				this.previous = `Now Playing: ${args.song!.name}`
				break;
			case MessageOptions.other: {
				embed = this.createEmbed(args.queue);
				this.previous = args.note!;
				break;
			}
			case MessageOptions.skip: {
				if (args.queue.songs.length <= 1)
					this.song = undefined
				embed = this.createEmbed(args.queue);
				this.previous = `Skipped: ${args.song!.name}`;
				break;
			}
			case MessageOptions.addmusic: {
				embed = this.createEmbed(args.queue);
				this.previous = `Added to queue: ${args.song!.name}`;
				break;
			}
			default:
				embed = this.createEmbed(args.queue);
				this.previous = 'Unknown Option';
				break;
		}
		return embed;

	}

	private createEmbed(queue: Queue): MessageEmbed {
		const auth = {} as EmbedAuthorData;
		auth.name = "Music Player";
		auth.iconURL = "https://raw.githubusercontent.com/jadestudios/JadeStudios-DiscordBot/main/image/music.png";

		let currentEmbed;
		if (this.song) {
			currentEmbed = new MessageEmbed()
				.setColor('#66ccff')
				.setAuthor(auth)
				.setThumbnail(this.song ? this.song.thumbnail : '')
				.addFields(
					{ name: '**Previous Action:**', value: this.previous },
					{ name: '\u200B', value: '\u200B' },
					{ name: '**Now Playing:**', value: `[${this.song.name}](${this.song.url})` },
					{ name: '**Channel**', value: this.song.author, inline: true },
					{ name: '**Duration**', value: this.song.duration, inline: true },
				)
				.setFooter({ text: `Song Loop: ${queue.repeatMode === RepeatMode.SONG ? MessageEmoji.on : MessageEmoji.off} | Queue Loop: ${queue.repeatMode === RepeatMode.QUEUE ? MessageEmoji.on : MessageEmoji.off}` })
		} else {
			currentEmbed = new MessageEmbed()
				.setColor('#66ccff')
				.setAuthor(auth)
				.setDescription(this.previous);
		}
		return currentEmbed
	}
}