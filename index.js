const {
    Client,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputStyle,
    TextInputBuilder
} = require('discord.js');
const client = new Client({ intents: ['Guilds', 'MessageContent', 'GuildMessages'] });
const config = require('./config.json');
require('dotenv').config();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', (message) => {
    if (message.content === '!send') {
        if (!config.admins.includes(message.author.id)) return;
        const embed = new EmbedBuilder()
            .setTitle('Apply for Staff')
            .setDescription('Click the button below to apply for staff')
            .setColor('Red');
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setStyle(ButtonStyle.Success)
                    .setLabel('Apply')
                    .setCustomId('apply')
            );
        const channel = message.guild.channels.cache.get(config.embedChannel);
        if (!channel) return;
        channel.send({
            embeds: [embed],
            components: [row]
        });
    }
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isButton()) {
        if (interaction.customId === 'apply') {
            const modal = new ModalBuilder()
                .setTitle('Staff Application')
                .setCustomId('staff_apply');

            const nameComponent = new TextInputBuilder()
                .setCustomId('staff_name')
                .setLabel("What's your name?")
                .setMinLength(2)
                .setMaxLength(25)
                .setRequired(true)
                .setPlaceholder('M. Fonix')
                .setStyle(TextInputStyle.Short);

            const ageComponent = new TextInputBuilder()
                .setCustomId('staff_age')
                .setLabel("Your Age")
                .setMinLength(1)
                .setMaxLength(3)
                .setRequired(true)
                .setPlaceholder('18..25..35')
                .setStyle(TextInputStyle.Short);

            const whyYou = new TextInputBuilder()
                .setCustomId('staff_why_you')
                .setLabel("Why you should be staff here")
                .setMinLength(10)
                .setMaxLength(120)
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder(`Tell us the reason for wanting to be staff in ${interaction.guild.name}`)
                .setRequired(true);

            const availabilityComponent = new TextInputBuilder()
                .setCustomId('staff_availability')
                .setLabel("When are you usually available?")
                .setMinLength(5)
                .setMaxLength(100)
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Evenings, weekends, 2PM-6PM, etc.')
                .setRequired(true);

            const rows = [nameComponent, ageComponent, whyYou, availabilityComponent].map(
                component => new ActionRowBuilder().addComponents(component)
            );

            modal.addComponents(...rows);
            interaction.showModal(modal);
        }

        if (interaction.customId === 'staff_accept') {
            const getIdFromFooter = interaction.message.embeds[0].footer.text;
            const getMember = await interaction.guild.members.fetch(getIdFromFooter);
            await getMember.roles.add(config.staffRoles).catch((err) => {
                console.error(err);
                return interaction.reply({
                    content: ":x: There was an error when trying to add roles to the user."
                });
            });
            interaction.reply({
                content: `✅ Added roles for **${getMember.user.tag}**, Accepted by ${interaction.user.tag}`
            });
            await getMember.send({
                content: `Hey ${getMember.user.tag}, You have been accepted for staff application. 🎉 **Congratulations!** 🎉`
            }).catch(() => {
                return interaction.message.reply(':x: There was an error when trying to send a message to the user.');
            });
            const newDisabledRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('staff_accept_ended')
                        .setDisabled()
                        .setStyle(ButtonStyle.Success)
                        .setLabel('Accept'),
                    new ButtonBuilder()
                        .setCustomId('staff_deny_ended')
                        .setDisabled()
                        .setStyle(ButtonStyle.Danger)
                        .setLabel('Deny')
                );
            interaction.message.edit({ components: [newDisabledRow] });
        }

        if (interaction.customId === 'staff_deny') {
            const getIdFromFooter = interaction.message.embeds[0].footer?.text;
            const getMember = await interaction.guild.members.fetch(getIdFromFooter);
            await getMember.send({
                content: `Hey ${getMember.user.tag}, sorry you have been rejected for staff application.`
            }).catch(() => {});
            interaction.reply({
                content: `:x: ${getMember.user.tag} has been rejected by ${interaction.user.tag}.`
            });
            const newDisabledRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('staff_accept_ended')
                        .setDisabled()
                        .setStyle(ButtonStyle.Success)
                        .setLabel('Accept'),
                    new ButtonBuilder()
                        .setCustomId('staff_deny_ended')
                        .setDisabled()
                        .setStyle(ButtonStyle.Danger)
                        .setLabel('Deny')
                );
            interaction.message.edit({ components: [newDisabledRow] });
        }
    }

    if (interaction.isModalSubmit()) {
        if (interaction.customId === 'staff_apply') {
            const staffName = interaction.fields.getTextInputValue('staff_name');
            const staffAge = interaction.fields.getTextInputValue('staff_age');
            const staffWhyYou = interaction.fields.getTextInputValue('staff_why_you');
            const staffAvailability = interaction.fields.getTextInputValue('staff_availability');

            if (isNaN(staffAge)) {
                return interaction.reply({
                    content: ":x: Your age must be a number, please resend the form.",
                    ephemeral: true
                });
            }

            if (!isNaN(staffName)) {
                return interaction.reply({
                    content: ":x: Your name must not include numbers.",
                    ephemeral: true
                });
            }

            interaction.reply({
                content: '✅ Your staff application has been submitted successfully.',
                ephemeral: true
            });

            const staffSubmitChannel = interaction.guild.channels.cache.get(config.submitChannel);
            if (!staffSubmitChannel) return;

            const embed = new EmbedBuilder()
                .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
                .setColor('Blue')
                .setTimestamp()
                .setFooter({ text: interaction.user.id })
                .setThumbnail(interaction.user.displayAvatarURL())
                .addFields(
                    { name: "Name:", value: staffName },
                    { name: "Age:", value: staffAge },
                    { name: "Why you should be staff here:", value: staffWhyYou },
                    { name: "Availability:", value: staffAvailability }
                );

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('staff_accept')
                        .setLabel('Accept')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('staff_deny')
                        .setLabel('Deny')
                        .setStyle(ButtonStyle.Danger)
                );

            staffSubmitChannel.send({
                embeds: [embed],
                components: [row]
            });
        }
    }
});

client.login(process.env.TOKEN);
