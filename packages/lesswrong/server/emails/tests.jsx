import React from 'react';
import { withDocument } from 'meteor/vulcan:core';
import { chai } from 'meteor/practicalmeteor:chai';
import chaiAsPromised from 'chai-as-promised';
import { createDummyUser, createDummyPost } from '../../testing/utils.js'
import { emailDoctype, generateEmail } from './renderEmail';
import { withStyles } from '@material-ui/core/styles';
import { Posts } from '../../lib/collections/posts';

chai.should();
chai.use(chaiAsPromised);

const unitTestBoilerplateGenerator = ({css,title,body}) => {
  const styleTag = (css && css.length>0) ? `<style>${css}</style>` : "";
  const html = `${styleTag}<body>${body}</body>`;
  return html;
}

describe('renderEmail', async () => {
  it("Renders a simple component", async () => {
    const email = await generateEmail({
      user: await createDummyUser(),
      subject: "Unit test email",
      bodyComponent: <div>Hello</div>,
      boilerplateGenerator: unitTestBoilerplateGenerator,
    });
    
    email.html.should.equal(emailDoctype+'<body><div>Hello</div></body>');
  });
  
  it("Generates a textual representation of the body", async () => {
    const email = await generateEmail({
      user: await createDummyUser(),
      subject: "Unit test email",
      bodyComponent: <div>Hello</div>,
      boilerplateGenerator: unitTestBoilerplateGenerator,
    });
    
    email.bodyText.should.equal("Hello");
  });
  
  it("Renders styles with withStyles", async () => {
    const styles = {
      underlined: {
        textDecoration: "underline",
      }
    };
    const StyledComponent = withStyles(styles, {name:"StyledComponent"})(
      ({classes, children}) =>
        <div className={classes.underlined}>{children}</div>
    );
    
    
    const email = await generateEmail({
      user: await createDummyUser(),
      subject: "Unit test email",
      bodyComponent: <div>Hello, <StyledComponent>World</StyledComponent></div>,
      boilerplateGenerator: unitTestBoilerplateGenerator,
    });
    
    email.html.should.equal(emailDoctype+'<body><div>Hello, <div class="StyledComponent-underlined" style="text-decoration: underline;">World</div></div></body>');
  });
  
  it("Can use Apollo HoCs", async () => {
    const user = await createDummyUser();
    const post = await createDummyPost(user, { title: "Email unit test post" });
    
    const queryOptions = {
      collection: Posts,
      queryName: 'postsSingleQuery',
      fragmentName: 'LWPostsPage',
      ssr: true
    };
    const PostTitleComponent = withDocument(queryOptions)(
      ({document}) => <div>{document.title}</div>
    );
    
    const email = await generateEmail({
      user: await createDummyUser(),
      subject: "Unit test email",
      bodyComponent: <PostTitleComponent documentId={post._id} />,
      boilerplateGenerator: unitTestBoilerplateGenerator,
    });
    email.html.should.equal(emailDoctype+'<body><div>Email unit test post</div></body>');
  });
  
  /*it("Supports the withCurrentUser HoC", async () => {
    // TODO: Not currently passing
    const user = await createDummyUser();
    
    const MyEmailComponent = withCurrentUser(
      ({currentUser}) => <div>{currentUser && currentUser.email}</div>
    );
    const email = await generateEmail({
      user: user,
      subject: "Unit test email",
      bodyComponent: <MyEmailComponent/>,
      boilerplateGenerator: unitTestBoilerplateGenerator,
    });
    email.html.should.equal(emailDoctype+`<body><div>${user.email}</div></body>`);
  });
  
  it("Restricts field accesses based on the current user", async () => {
    // TODO: Not currently passing
    // user1 has a PM. user1 is allowed to see it, user2 isn't.
    const user1 = await createDummyUser();
    const user2 = await createDummyUser();
    const conversation = await createDummyConversation(user1);
    await createDummyMessage(conversation);
    
    const MessagesByConversationComponent = withList({
      collection: Messages,
      queryName: "PrivateMessageQuery",
      fragmentName: "messageListFragment",
      ssr: true,
    })(
      ({results}) => <div>{results.map((message, i) => <div key={i}>{message.htmlBody}</div>)}</div>
    );
    const ShowThePMComponent = () =>
      <MessagesByConversationComponent terms={{view: 'messagesConversation', conversationId: conversation._id}} />
    
    const permissionGrantedEmail = await generateEmail({
      user: user1,
      subject: "Unit test email",
      bodyComponent: <ShowThePMComponent/>,
      boilerplateGenerator: unitTestBoilerplateGenerator,
    });
    const permissionDeniedEmail = await generateEmail({
      user: user2,
      subject: "Unit test email",
      bodyComponent: <ShowThePMComponent/>,
      boilerplateGenerator: unitTestBoilerplateGenerator,
    });
    
    permissionGrantedEmail.html.should.equal(emailDoctype+'<body><div><div>Message body</div></div></body>');
    permissionDeniedEmail.html.should.equal(emailDoctype+'<body><div></div></body>');
  });*/
});