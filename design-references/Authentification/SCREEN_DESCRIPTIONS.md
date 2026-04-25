# Lot 2 — Authentification — Screen Descriptions

## Écrans analysés

- `15_modern_password_reset_and_security_interface.png`
- `16_modern_password_reset_ui_mockup.png`
- `20_modern_saas_signup_and_dashboard_ui.png`
- `21_modern_verification_ui_design_mockup.png`
- `22_modern_web_app_login_interface_design.png`

---

## `15_modern_password_reset_and_security_interface.png`

### 1. Nom du fichier
`15_modern_password_reset_and_security_interface.png`

### 2. Type d’écran
Réinitialisation du mot de passe avec indicateur de sécurité.

### 3. Module applicatif concerné
`features/auth`

### 4. Route probable
`/reset-password`

### 5. Objectif fonctionnel de l’écran
Permettre à l’utilisateur de définir un nouveau mot de passe sécurisé après avoir suivi un lien de réinitialisation.

### 6. Layout général
- Écran split-screen en deux colonnes.
- Bandeau supérieur sombre avec logo `Studio Templates`.
- Colonne gauche illustrée, orientée confiance/sécurité.
- Colonne droite avec carte blanche centrée contenant le formulaire.
- Footer discret sous la carte avec copyright et liens légaux.

### 7. Zones principales
- Header global :
  - logo Studio Templates en haut à gauche.
- Partie gauche :
  - titre marketing : `Sécurité renforcée, simplicité garantie.`
  - texte d’accompagnement.
  - grande illustration bouclier/cadenas.
  - cartes flottantes de réassurance :
    - `Données sécurisées`
    - `Confidentialité prioritaire`
    - `Contrôle total`
    - `Accès fiable`
- Partie droite :
  - carte formulaire.
  - logo dans la carte.
  - titre : `Réinitialiser le mot de passe`.
  - sous-texte explicatif.
  - champ nouveau mot de passe.
  - champ confirmation.
  - indicateur de force du mot de passe.
  - critères de sécurité.
  - bouton principal.
  - lien retour connexion.
- Footer :
  - copyright.
  - liens `Confidentialité` et `Conditions d'utilisation`.

### 8. Composants visibles
- `AuthLayout`
- `AuthBrandHeader`
- `AuthIllustrationPanel`
- `AuthCard`
- `PasswordInput`
- `PasswordStrengthMeter`
- `PasswordRequirementList`
- `Button`
- `Link`
- `SecurityFeatureBadge`
- `FooterLinks`

### 9. Données affichées
- Nom produit : `Studio Templates`
- Titre : `Réinitialiser le mot de passe`
- Champs :
  - `Nouveau mot de passe`
  - `Confirmer le mot de passe`
- Force du mot de passe : `Fort`
- Critères :
  - au moins 8 caractères
  - inclut un chiffre
  - inclut une majuscule
  - inclut un caractère spécial
- CTA : `Mettre à jour le mot de passe`
- Lien : `Retour à la connexion`

### 10. Actions utilisateur visibles
- Saisir un nouveau mot de passe.
- Afficher/masquer le mot de passe via icône œil.
- Confirmer le mot de passe.
- Soumettre le nouveau mot de passe.
- Retourner à la page de connexion.

### 11. États UI visibles
- Champs mot de passe remplis avec caractères masqués.
- Force du mot de passe affichée comme `Fort`.
- Barre de force partiellement/fortement remplie en violet.
- Critères de sécurité validés avec icônes vertes.
- Bouton principal violet actif.
- Carte formulaire en état normal, sans erreur affichée.

### 12. Composants à créer ou réutiliser
À réutiliser :
- `AuthLayout`
- `AuthCard`
- `PasswordInput`
- `Button`
- `Kbd` si raccourcis visibles plus tard
- `FooterLinks`

À créer :
- `ResetPasswordPage`
- `AuthSecurityIllustrationPanel`
- `PasswordStrengthMeter`
- `PasswordRequirementList`
- `SecurityFeatureBadge`

### 13. Contraintes de fidélité visuelle
- Conserver le layout split-screen.
- Conserver le header sombre avec logo.
- Reproduire la grande illustration sécurité à gauche.
- Garder la carte formulaire centrée à droite.
- Respecter l’accent violet pour les mots importants et le bouton principal.
- Les critères de mot de passe doivent être visibles sous la jauge.
- Ne pas réduire cet écran à un formulaire simple.

### 14. Points d’ambiguïté
- Le token de réinitialisation n’est pas visible, mais il doit être géré côté logique.
- L’écran ne montre pas les états d’erreur : token expiré, mot de passe non conforme, confirmation différente.
- Les visuels de gauche peuvent être reproduits via illustration statique ou composition UI simplifiée.

### 15. Priorité d’implémentation
**P1** — écran auth important, à implémenter avec Better Auth et validation Zod.

---

## `16_modern_password_reset_ui_mockup.png`

### 1. Nom du fichier
`16_modern_password_reset_ui_mockup.png`

### 2. Type d’écran
Mot de passe oublié / demande de lien de réinitialisation.

### 3. Module applicatif concerné
`features/auth`

### 4. Route probable
`/forgot-password`

### 5. Objectif fonctionnel de l’écran
Permettre à l’utilisateur de demander un lien sécurisé de réinitialisation par e-mail.

### 6. Layout général
- Écran split-screen.
- Bandeau supérieur sombre avec logo.
- Colonne gauche illustrative orientée récupération d’accès et sécurité.
- Colonne droite avec carte de formulaire centrée.
- Card d’aide sous le formulaire.
- Footer avec copyright et liens légaux.

### 7. Zones principales
- Header :
  - logo Studio Templates.
- Colonne gauche :
  - titre : `Récupérez l’accès à votre compte en toute sécurité.`
  - texte : envoi d’un lien sécurisé par e-mail.
  - illustration laptop + cadenas + enveloppe.
  - badges flottants de sécurité.
- Colonne droite :
  - carte formulaire.
  - logo Studio Templates.
  - titre : `Mot de passe oublié`
  - texte d’aide.
  - champ adresse e-mail.
  - bouton principal.
  - séparateur `ou`.
  - lien retour connexion.
- Card d’aide :
  - `Vous ne recevez pas l'e-mail ?`
  - conseils spam/courrier indésirable.
  - validité du lien 15 minutes.
- Footer :
  - copyright.
  - confidentialité.
  - conditions d’utilisation.

### 8. Composants visibles
- `AuthLayout`
- `AuthIllustrationPanel`
- `AuthCard`
- `EmailInput`
- `Button`
- `Divider`
- `HelpCard`
- `FooterLinks`
- `IconBadge`

### 9. Données affichées
- Titre marketing : `Récupérez l’accès à votre compte en toute sécurité.`
- Titre formulaire : `Mot de passe oublié`
- Champ : `Adresse e-mail`
- Placeholder : `votre@email.com`
- CTA : `Envoyer le lien de réinitialisation`
- Lien : `Retour à la connexion`
- Aide :
  - `Vous ne recevez pas l'e-mail ?`
  - `Vérifiez votre dossier spam ou courrier indésirable.`
  - `Le lien est valable pendant 15 minutes.`

### 10. Actions utilisateur visibles
- Saisir une adresse e-mail.
- Envoyer le lien de réinitialisation.
- Retourner à la connexion.

### 11. États UI visibles
- Champ e-mail vide avec placeholder.
- Bouton principal actif.
- Card d’aide informative avec icône verte.
- Aucun état d’erreur visible.
- Aucun état de succès post-envoi visible.

### 12. Composants à créer ou réutiliser
À réutiliser :
- `AuthLayout`
- `AuthCard`
- `EmailInput`
- `Button`
- `Divider`
- `FooterLinks`

À créer :
- `ForgotPasswordPage`
- `AuthRecoveryIllustrationPanel`
- `AuthHelpCard`

### 13. Contraintes de fidélité visuelle
- Conserver la séparation visuelle entre illustration gauche et formulaire droit.
- Garder le style calme, rassurant, orienté sécurité.
- Le bloc d’aide sous le formulaire doit être visible.
- Le bouton principal doit occuper toute la largeur du formulaire.
- Ne pas fusionner l’aide avec le formulaire principal.

### 14. Points d’ambiguïté
- L’écran ne montre pas l’état après envoi réussi.
- Le provider d’e-mail n’est pas visible.
- Le délai de validité du lien est visible comme `15 minutes`, à reprendre dans les textes.

### 15. Priorité d’implémentation
**P1** — écran auth standard indispensable.

---

## `20_modern_saas_signup_and_dashboard_ui.png`

### 1. Nom du fichier
`20_modern_saas_signup_and_dashboard_ui.png`

### 2. Type d’écran
Création de compte / inscription.

### 3. Module applicatif concerné
`features/auth`

### 4. Route probable
`/signup`

### 5. Objectif fonctionnel de l’écran
Permettre à un nouvel utilisateur de créer un compte Studio Templates avec e-mail/mot de passe ou via providers OAuth.

### 6. Layout général
- Écran split-screen avec header sombre.
- Colonne gauche très orientée produit :
  - promesse,
  - capture de l’éditeur,
  - carte flottante de bénéfices.
- Colonne droite :
  - carte d’inscription complète.
  - formulaire multi-champs.
  - boutons OAuth.
  - lien vers connexion.
- Footer en bas de colonne droite.

### 7. Zones principales
- Header :
  - logo Studio Templates.
- Colonne gauche :
  - titre : `Lancez votre espace Studio Templates`
  - texte produit.
  - grande capture de l’éditeur CV/template.
  - carte flottante `Prêt à démarrer`.
- Colonne droite :
  - carte signup.
  - logo.
  - titre : `Créer un compte`
  - sous-titre.
  - champs prénom et nom en deux colonnes.
  - champ adresse e-mail.
  - champ mot de passe.
  - champ confirmation mot de passe.
  - checkbox acceptation CGU / confidentialité.
  - bouton principal.
  - séparateur `ou`.
  - boutons OAuth Google et Microsoft.
  - lien vers connexion.
- Footer :
  - copyright et liens légaux.

### 8. Composants visibles
- `AuthLayout`
- `AuthProductPanel`
- `AuthCard`
- `TextInput`
- `EmailInput`
- `PasswordInput`
- `Checkbox`
- `Button`
- `OAuthButton`
- `Divider`
- `FooterLinks`
- `ProductPreviewMockup`
- `BenefitCard`

### 9. Données affichées
- Titre produit : `Lancez votre espace Studio Templates`
- Titre formulaire : `Créer un compte`
- Champs :
  - `Prénom`
  - `Nom`
  - `Adresse e-mail`
  - `Mot de passe`
  - `Confirmer le mot de passe`
- Placeholder :
  - `Votre prénom`
  - `Votre nom`
  - `votre@email.com`
  - `Créez un mot de passe`
  - `Confirmez votre mot de passe`
- Aide mot de passe :
  - `Minimum 8 caractères avec une majuscule, un chiffre et un symbole.`
- Checkbox :
  - acceptation conditions d’utilisation et politique de confidentialité.
- CTA :
  - `Créer mon compte`
- OAuth :
  - `Continuer avec Google`
  - `Continuer avec Microsoft`
- Lien :
  - `Vous avez déjà un compte ? Se connecter`

### 10. Actions utilisateur visibles
- Saisir prénom, nom, e-mail, mot de passe, confirmation.
- Afficher/masquer les mots de passe.
- Accepter les conditions.
- Créer un compte.
- Continuer avec Google.
- Continuer avec Microsoft.
- Aller vers la connexion.

### 11. États UI visibles
- Checkbox CGU cochée.
- Bouton principal violet actif.
- Champs vides avec placeholders.
- Boutons OAuth secondaires.
- Aucun état d’erreur visible.
- Carte bénéfices à gauche avec éléments validés.

### 12. Composants à créer ou réutiliser
À réutiliser :
- `AuthLayout`
- `AuthCard`
- `TextInput`
- `EmailInput`
- `PasswordInput`
- `Checkbox`
- `Button`
- `OAuthButton`
- `Divider`
- `FooterLinks`

À créer :
- `SignupPage`
- `SignupForm`
- `AuthProductPreviewPanel`
- `ProductPreviewMockup`
- `BenefitChecklistCard`

### 13. Contraintes de fidélité visuelle
- Le panneau gauche doit mettre en avant l’éditeur Studio Templates.
- Le formulaire doit rester dans une grande card blanche.
- Les champs prénom/nom doivent rester sur la même ligne en desktop.
- Garder les boutons OAuth séparés du CTA principal par un diviseur.
- Ne pas supprimer l’acceptation CGU.
- Garder l’accent violet sur le titre et le bouton.

### 14. Points d’ambiguïté
- Le screenshot montre un aperçu produit à gauche ; en V1, il peut être une image statique ou un composant mocké.
- Le processus post-signup n’est pas visible : vérification e-mail, onboarding ou redirection dashboard.
- Les providers OAuth affichés sont Google et Microsoft ; à confirmer avec Better Auth.

### 15. Priorité d’implémentation
**P1** — écran principal d’acquisition utilisateur.

---

## `21_modern_verification_ui_design_mockup.png`

### 1. Nom du fichier
`21_modern_verification_ui_design_mockup.png`

### 2. Type d’écran
Vérification en deux étapes / OTP.

### 3. Module applicatif concerné
`features/auth`

### 4. Route probable
`/two-factor`  
ou `/verify`

### 5. Objectif fonctionnel de l’écran
Permettre à l’utilisateur de saisir un code à 6 chiffres envoyé par e-mail pour valider son identité ou finaliser une connexion sécurisée.

### 6. Layout général
- Écran split-screen.
- Header sombre.
- Colonne gauche avec promesse produit et capture de l’éditeur.
- Colonne droite avec carte OTP centrée.
- Footer sous la carte.

### 7. Zones principales
- Header :
  - logo Studio Templates.
- Colonne gauche :
  - titre : `Créez, personnalisez et publiez vos templates en toute simplicité.`
  - texte produit.
  - capture de l’éditeur CV/template.
- Colonne droite :
  - carte vérification.
  - logo.
  - titre : `Vérification en 2 étapes`
  - texte explicatif.
  - bloc e-mail masqué.
  - input OTP à 6 cases.
  - timer de renvoi.
  - lien `Renvoyer le code`.
  - bouton principal `Vérifier`.
  - séparateur `ou`.
  - lien autre méthode.
- Footer :
  - copyright.
  - liens confidentialité et conditions.

### 8. Composants visibles
- `AuthLayout`
- `AuthProductPanel`
- `AuthCard`
- `OtpInput`
- `MaskedEmailBadge`
- `CountdownTimer`
- `Button`
- `Divider`
- `Link`
- `FooterLinks`
- `ProductPreviewMockup`

### 9. Données affichées
- Titre : `Vérification en 2 étapes`
- Message : code à 6 chiffres envoyé à une adresse e-mail.
- Email masqué : `•••••••@email.com`
- OTP : 6 champs.
- Timer : `00:45`
- Actions :
  - `Renvoyer le code`
  - `Vérifier`
  - `Utiliser une autre méthode`

### 10. Actions utilisateur visibles
- Saisir un code OTP à 6 chiffres.
- Renvoyer le code.
- Vérifier le code.
- Utiliser une autre méthode.

### 11. États UI visibles
- Premier champ OTP focus avec bordure violette.
- Timer actif avant renvoi.
- Bouton principal violet.
- Aucun état d’erreur visible.
- Aucun état succès visible.

### 12. Composants à créer ou réutiliser
À réutiliser :
- `AuthLayout`
- `AuthCard`
- `Button`
- `Divider`
- `FooterLinks`
- `ProductPreviewMockup`

À créer :
- `TwoFactorVerificationPage`
- `OtpVerificationForm`
- `MaskedEmailBadge`
- `ResendCodeTimer`

Bibliothèque à utiliser :
- `input-otp`

### 13. Contraintes de fidélité visuelle
- Utiliser `input-otp` pour les 6 cases OTP.
- Conserver le focus violet sur la case active.
- Le bloc e-mail masqué doit rester visible.
- Garder les actions renvoi / autre méthode.
- Ne pas remplacer l’OTP par un champ texte unique.

### 14. Points d’ambiguïté
- Le canal OTP visible est e-mail, mais il peut aussi être utilisé pour 2FA.
- L’écran ne montre pas les états code invalide, expiré ou renvoi réussi.
- La route peut être `/two-factor`, `/verify`, ou `/auth/verify`; recommandation : `/two-factor`.

### 15. Priorité d’implémentation
**P1** — important si 2FA / vérification par code est retenu.

---

## `22_modern_web_app_login_interface_design.png`

### 1. Nom du fichier
`22_modern_web_app_login_interface_design.png`

### 2. Type d’écran
Connexion.

### 3. Module applicatif concerné
`features/auth`

### 4. Route probable
`/login`

### 5. Objectif fonctionnel de l’écran
Permettre à un utilisateur existant de se connecter avec e-mail/mot de passe ou via providers OAuth.

### 6. Layout général
- Écran split-screen.
- Header sombre avec logo.
- Colonne gauche avec promesse produit et capture de l’éditeur.
- Colonne droite avec carte de connexion.
- Footer sous la carte.

### 7. Zones principales
- Header :
  - logo Studio Templates.
- Colonne gauche :
  - titre : `Créez, personnalisez et publiez vos templates en toute simplicité.`
  - texte produit.
  - capture de l’éditeur CV/template.
  - carte flottante `Publication`.
- Colonne droite :
  - carte login.
  - logo.
  - titre : `Connexion`
  - sous-titre.
  - champ e-mail.
  - champ mot de passe.
  - checkbox `Se souvenir de moi`.
  - lien mot de passe oublié.
  - bouton principal.
  - séparateur `ou`.
  - boutons OAuth Google et Microsoft.
  - lien création de compte.
- Footer :
  - copyright.
  - confidentialité.
  - conditions d’utilisation.

### 8. Composants visibles
- `AuthLayout`
- `AuthProductPanel`
- `AuthCard`
- `EmailInput`
- `PasswordInput`
- `Checkbox`
- `Button`
- `OAuthButton`
- `Divider`
- `Link`
- `FooterLinks`
- `ProductPreviewMockup`
- `FloatingStatusCard`

### 9. Données affichées
- Titre produit : `Créez, personnalisez et publiez vos templates en toute simplicité.`
- Titre formulaire : `Connexion`
- Champs :
  - `Adresse e-mail`
  - `Mot de passe`
- Placeholder :
  - `votre@email.com`
- Options :
  - `Se souvenir de moi`
  - `Mot de passe oublié ?`
- CTA :
  - `Se connecter`
- OAuth :
  - `Continuer avec Google`
  - `Continuer avec Microsoft`
- Lien :
  - `Vous n’avez pas de compte ? Créer un compte`
- Carte flottante :
  - `Publication`
  - vérification des données
  - aperçu responsive
  - optimisation des assets
  - bouton `Publier le template`

### 10. Actions utilisateur visibles
- Saisir e-mail.
- Saisir mot de passe.
- Afficher/masquer le mot de passe.
- Cocher/décocher se souvenir de moi.
- Aller vers mot de passe oublié.
- Se connecter.
- Se connecter avec Google.
- Se connecter avec Microsoft.
- Aller vers création de compte.

### 11. États UI visibles
- Checkbox `Se souvenir de moi` cochée.
- Champ mot de passe rempli/masqué.
- Bouton principal violet actif.
- OAuth en boutons secondaires.
- Aucun état d’erreur visible.
- Carte gauche de publication avec checks verts.

### 12. Composants à créer ou réutiliser
À réutiliser :
- `AuthLayout`
- `AuthCard`
- `EmailInput`
- `PasswordInput`
- `Checkbox`
- `Button`
- `OAuthButton`
- `Divider`
- `FooterLinks`
- `ProductPreviewMockup`

À créer :
- `LoginPage`
- `LoginForm`
- `AuthProductPanel`
- `FloatingPublicationCard`

### 13. Contraintes de fidélité visuelle
- Respecter le split-screen.
- Conserver la capture produit à gauche.
- Garder la card de connexion large et centrée.
- Le lien `Mot de passe oublié ?` doit rester aligné à droite de la ligne `Se souvenir de moi`.
- Les boutons OAuth doivent rester sous le séparateur.
- Ne pas supprimer la carte flottante de publication.

### 14. Points d’ambiguïté
- Les providers Google/Microsoft doivent être confirmés dans Better Auth.
- Le comportement `Se souvenir de moi` n’est pas détaillé.
- L’écran ne montre pas les erreurs d’identifiants invalides, compte bloqué ou 2FA requis.

### 15. Priorité d’implémentation
**P1** — écran d’entrée principal.

---

# Synthèse globale du lot

## Mapping écran → route → feature

| Image | Route recommandée | Feature principale | Priorité |
|---|---|---|---|
| `22_modern_web_app_login_interface_design.png` | `/login` | `features/auth` | P1 |
| `20_modern_saas_signup_and_dashboard_ui.png` | `/signup` | `features/auth` | P1 |
| `16_modern_password_reset_ui_mockup.png` | `/forgot-password` | `features/auth` | P1 |
| `15_modern_password_reset_and_security_interface.png` | `/reset-password` | `features/auth` | P1 |
| `21_modern_verification_ui_design_mockup.png` | `/two-factor` | `features/auth` | P1 |

---

# Routes recommandées

```txt
/login
/signup
/forgot-password
/reset-password
/two-factor